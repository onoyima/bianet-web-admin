import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Eye, ArrowUpRight, ArrowLeftRight, ArrowDownToLine, RefreshCw, Wallet, AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";

const STATUS_BADGE: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  AWAITING_DEPOSIT: { variant: "outline", label: "Awaiting Deposit" },
  FUNDS_HELD: { variant: "secondary", label: "Funds Held" },
  FUNDS_RELEASED: { variant: "default", label: "Released" },
  IN_DISPUTE: { variant: "destructive", label: "In Dispute" },
  ARBITRATION_SETTLED: { variant: "secondary", label: "Arbitration Settled" },
  REFUNDED: { variant: "outline", label: "Refunded" },
  CANCELLED: { variant: "outline", label: "Cancelled" },
};

interface Escrow {
  id: string;
  platform: string;
  listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  amount: string;
  currency: string;
  status: string;
  payment_reference: string | null;
  dispute_reason: string | null;
  arbitration_notes: string | null;
  created_at: string;
  updated_at: string;
  buyer_phone?: string;
  buyer_avatar_url?: string;
  buyer_first_name?: string;
  buyer_last_name?: string;
  buyer_business_name?: string;
  seller_phone?: string;
  seller_avatar_url?: string;
  seller_first_name?: string;
  seller_last_name?: string;
  seller_business_name?: string;
}

interface EscrowResponse {
  data: Escrow[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

function formatAmount(amount: string, currency: string) {
  return `${currency === "NGN" ? "₦" : "$"}${Number(amount).toLocaleString()}`;
}

function DialogEscrowDetail({ escrow, open, onClose }: { escrow: Escrow | null; open: boolean; onClose: () => void }) {
  if (!escrow) return null;

  const buyerName = escrow.buyer_business_name || (escrow.buyer_first_name && escrow.buyer_last_name
    ? `${escrow.buyer_first_name} ${escrow.buyer_last_name}`
    : escrow.buyer_id);
  const sellerName = escrow.seller_business_name || (escrow.seller_first_name && escrow.seller_last_name
    ? `${escrow.seller_first_name} ${escrow.seller_last_name}`
    : escrow.seller_id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Escrow Detail</DialogTitle>
          <DialogDescription>Full details of escrow transaction</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">ID</span>
            <span className="font-mono text-xs">{escrow.id}</span>
            <span className="text-muted-foreground">Platform</span>
            <Badge variant="outline" className="w-fit">{escrow.platform}</Badge>
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">{formatAmount(escrow.amount, escrow.currency)}</span>
            <span className="text-muted-foreground">Status</span>
            <Badge variant={STATUS_BADGE[escrow.status]?.variant ?? "outline"}>
              {STATUS_BADGE[escrow.status]?.label ?? escrow.status}
            </Badge>
            <span className="text-muted-foreground">Buyer</span>
            <span className="flex items-center gap-2">
              {escrow.buyer_avatar_url ? (
                <img src={escrow.buyer_avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                  {(buyerName[0] ?? "?").toUpperCase()}
                </div>
              )}
              <span>{buyerName}</span>
            </span>
            <span className="text-muted-foreground">Seller</span>
            <span className="flex items-center gap-2">
              {escrow.seller_avatar_url ? (
                <img src={escrow.seller_avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                  {(sellerName[0] ?? "?").toUpperCase()}
                </div>
              )}
              <span>{sellerName}</span>
            </span>
            <span className="text-muted-foreground">Payment Ref</span>
            <span className="font-mono text-xs">{escrow.payment_reference ?? "—"}</span>
            <span className="text-muted-foreground">Created</span>
            <span>{new Date(escrow.created_at).toLocaleString()}</span>
          </div>
          {escrow.dispute_reason && (
            <div>
              <span className="text-muted-foreground block mb-1">Dispute Reason</span>
              <p className="text-sm bg-muted p-2 rounded">{escrow.dispute_reason}</p>
            </div>
          )}
          {escrow.arbitration_notes && (
            <div>
              <span className="text-muted-foreground block mb-1">Arbitration Notes</span>
              <p className="text-sm bg-muted p-2 rounded">{escrow.arbitration_notes}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminEscrow() {
  const [data, setData] = useState<EscrowResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [selectedEscrow, setSelectedEscrow] = useState<Escrow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [arbitrateOpen, setArbitrateOpen] = useState(false);
  const [arbitrateData, setArbitrateData] = useState({ decision: "", notes: "", payoutBuyer: "", payoutSeller: "" });
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const fetchEscrows = useCallback(async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("accessToken");
      if (!token) { toast({ title: "Error", description: "Not authenticated", variant: "destructive" }); return; }
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      if (platformFilter) params.set("platform", platformFilter);
      const res = await fetch(`/api/v1/admin/escrow?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      setData(await res.json());
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, platformFilter, toast]);

  useEffect(() => { fetchEscrows(); }, [fetchEscrows]);

  const handleAction = async (action: string, id: string) => {
    setActionLoading(true);
    try {
      const token = sessionStorage.getItem("accessToken");
      let url = `/api/v1/admin/escrow/${id}/${action}`;
      let body: Record<string, unknown> = {};

      if (action === "arbitrate") {
        url = `/api/v1/admin/escrow/${id}/resolve`;
        body = { decision: arbitrateData.decision, notes: arbitrateData.notes };
        if (arbitrateData.decision === "SPLIT") {
          body.payoutBuyer = arbitrateData.payoutBuyer;
          body.payoutSeller = arbitrateData.payoutSeller;
        }
      }

      const res = await fetch(url, {
        method: action === "arbitrate" ? "POST" : "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Action failed");
      }

      toast({ title: "Success", description: `Escrow ${action} completed` });
      setArbitrateOpen(false);
      fetchEscrows();
      queryClient.invalidateQueries();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const openArbitrate = (escrow: Escrow) => {
    setSelectedEscrow(escrow);
    setArbitrateData({ decision: "", notes: "", payoutBuyer: "", payoutSeller: "" });
    setArbitrateOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Escrow Management</CardTitle>
            <CardDescription>Monitor and manage all escrow transactions across platforms</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchEscrows} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Statuses</SelectItem>
                <SelectItem value="AWAITING_DEPOSIT">Awaiting Deposit</SelectItem>
                <SelectItem value="FUNDS_HELD">Funds Held</SelectItem>
                <SelectItem value="FUNDS_RELEASED">Released</SelectItem>
                <SelectItem value="IN_DISPUTE">In Dispute</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={platformFilter} onValueChange={(v) => { setPlatformFilter(v); setPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Platforms</SelectItem>
                <SelectItem value="SEED">Seed</SelectItem>
                <SelectItem value="BARTAR">Bartar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : data && data.data.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((escrow) => (
                    <TableRow key={escrow.id}>
                      <TableCell className="font-mono text-xs">{escrow.id.substring(0, 8)}...</TableCell>
                      <TableCell><Badge variant="outline">{escrow.platform}</Badge></TableCell>
                      <TableCell className="font-medium">{formatAmount(escrow.amount, escrow.currency)}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE[escrow.status]?.variant ?? "outline"}>
                          {STATUS_BADGE[escrow.status]?.label ?? escrow.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {escrow.buyer_avatar_url ? (
                            <img src={escrow.buyer_avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                              {(escrow.buyer_first_name?.[0] ?? escrow.buyer_id?.[0] ?? "?").toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate max-w-[120px]">
                              {escrow.buyer_business_name || (escrow.buyer_first_name && escrow.buyer_last_name
                                ? `${escrow.buyer_first_name} ${escrow.buyer_last_name}`
                                : escrow.buyer_id?.substring(0, 8) + "...")}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {escrow.seller_avatar_url ? (
                            <img src={escrow.seller_avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                              {(escrow.seller_first_name?.[0] ?? escrow.seller_id?.[0] ?? "?").toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate max-w-[120px]">
                              {escrow.seller_business_name || (escrow.seller_first_name && escrow.seller_last_name
                                ? `${escrow.seller_first_name} ${escrow.seller_last_name}`
                                : escrow.seller_id?.substring(0, 8) + "...")}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{new Date(escrow.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedEscrow(escrow); setDetailOpen(true); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {escrow.status === "IN_DISPUTE" && (
                            <Button variant="ghost" size="icon" onClick={() => openArbitrate(escrow)}>
                              <ArrowLeftRight className="h-4 w-4" />
                            </Button>
                          )}
                          {escrow.status === "FUNDS_HELD" && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handleAction("release", escrow.id)}>
                                <ArrowUpRight className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleAction("refund", escrow.id)}>
                                <ArrowDownToLine className="h-4 w-4 text-orange-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <span>Page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} total)</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="h-8 w-8 mx-auto mb-3 opacity-20" />
              <p>No escrow transactions found.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <DialogEscrowDetail escrow={selectedEscrow} open={detailOpen} onClose={() => setDetailOpen(false)} />

      <Dialog open={arbitrateOpen} onOpenChange={setArbitrateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arbitrate Dispute</DialogTitle>
            <DialogDescription>Resolve this disputed escrow transaction</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Decision</Label>
              <Select value={arbitrateData.decision} onValueChange={(v) => setArbitrateData((d) => ({ ...d, decision: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RELEASE_TO_SELLER">Release to Seller</SelectItem>
                  <SelectItem value="REFUND_TO_BUYER">Refund to Buyer</SelectItem>
                  <SelectItem value="SPLIT">Split</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {arbitrateData.decision === "SPLIT" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Payout to Buyer</Label>
                  <Input value={arbitrateData.payoutBuyer} onChange={(e) => setArbitrateData((d) => ({ ...d, payoutBuyer: e.target.value }))} placeholder="0.00" />
                </div>
                <div>
                  <Label>Payout to Seller</Label>
                  <Input value={arbitrateData.payoutSeller} onChange={(e) => setArbitrateData((d) => ({ ...d, payoutSeller: e.target.value }))} placeholder="0.00" />
                </div>
              </div>
            )}
            <div>
              <Label>Arbitration Notes (min 20 chars)</Label>
              <Textarea value={arbitrateData.notes} onChange={(e) => setArbitrateData((d) => ({ ...d, notes: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArbitrateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => selectedEscrow && handleAction("arbitrate", selectedEscrow.id)}
              disabled={actionLoading || !arbitrateData.decision || arbitrateData.notes.length < 20}
            >
              {actionLoading ? "Processing..." : "Submit Arbitration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
