import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { customFetch } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Scale, Search, ChevronLeft, ChevronRight, ShieldCheck, XCircle } from "lucide-react";

export default function SupportDisputes() {
  const { toast } = useToast();
  const [escrows, setEscrows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("DISPUTED");
  const [selected, setSelected] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [decision, setDecision] = useState("");
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState("");

  const fetchEscrows = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const res = await customFetch<any>(`/api/v1/admin/escrow?${params}`);
      setEscrows(res.data ?? []);
    } catch (err: any) {
      toast({ title: "Failed to load", description: err?.data?.error ?? err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEscrows(); }, [page, statusFilter]);

  const handleResolve = async () => {
    if (!selected || !decision) return;
    setProcessing(true);
    try {
      await customFetch(`/api/v1/admin/escrow/${selected.id}/resolve`, {
        method: "POST",
        body: JSON.stringify({ decision, notes }),
      });
      toast({ title: "Dispute resolved", description: `Decision: ${decision}` });
      setOpen(false);
      setSelected(null);
      setDecision("");
      setNotes("");
      fetchEscrows();
    } catch (err: any) {
      toast({ title: "Failed to resolve", description: err?.data?.error ?? err.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const filtered = search.trim()
    ? escrows.filter((e) =>
        (e.reference ?? e.id).toLowerCase().includes(search.toLowerCase())
      )
    : escrows;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Dispute Resolution</h2>
        <p className="text-muted-foreground mt-1">Review and resolve order and payment disputes.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5" /> Escrow Disputes</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9 w-48" placeholder="Search reference..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="HELD">Held</SelectItem>
                  <SelectItem value="DISPUTED">Disputed</SelectItem>
                  <SelectItem value="RELEASED">Released</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><Scale className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>No disputes found.</p></div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Reference</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono text-xs">{e.reference ?? e.id?.substring(0, 8)}...</TableCell>
                      <TableCell className="font-medium">{e.currency || "NGN"} {e.amount?.toLocaleString() ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={e.status === "RELEASED" ? "default" : e.status === "DISPUTED" ? "destructive" : e.status === "HELD" ? "secondary" : "outline"}>
                          {e.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{e.platform ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelected(e); setOpen(true); }}
                          disabled={e.status !== "DISPUTED"}
                        >
                          <Scale className="h-4 w-4 mr-1" /> Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSelected(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
            <DialogDescription>
              Escrow: {selected?.reference ?? selected?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Amount:</span> <span className="font-medium">{selected?.currency || "NGN"} {selected?.amount?.toLocaleString()}</span></div>
              <div><span className="text-muted-foreground">Status:</span> <Badge variant="outline">{selected?.status}</Badge></div>
            </div>
            <div className="space-y-2">
              <Label>Decision</Label>
              <div className="flex gap-2">
                <Button variant={decision === "RELEASE" ? "default" : "outline"} className="flex-1" onClick={() => setDecision("RELEASE")}>
                  <ShieldCheck className="h-4 w-4 mr-2" /> Release to Seller
                </Button>
                <Button variant={decision === "REFUND" ? "destructive" : "outline"} className="flex-1" onClick={() => setDecision("REFUND")}>
                  <XCircle className="h-4 w-4 mr-2" /> Refund Buyer
                </Button>
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant={decision === "SPLIT_70_30" ? "secondary" : "outline"} className="flex-1" onClick={() => setDecision("SPLIT_70_30")}>70/30 Split</Button>
                <Button variant={decision === "SPLIT_50_50" ? "secondary" : "outline"} className="flex-1" onClick={() => setDecision("SPLIT_50_50")}>50/50 Split</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Arbitration Notes</Label>
              <Textarea id="notes" placeholder="Detailed reasoning..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); setSelected(null); }}>Cancel</Button>
            <Button onClick={handleResolve} disabled={!decision || processing}>
              {processing ? "Processing..." : "Submit Resolution"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
