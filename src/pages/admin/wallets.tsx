import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Search, RefreshCw, Wallet, ChevronLeft, ChevronRight, Eye } from "lucide-react";

interface UserWallet {
  id: string;
  user_id: string;
  balance: number;
  pending_balance: number;
  total_deposited: number;
  total_withdrawn: number;
  currency: string;
  created_at: string;
  updated_at: string;
  user_phone: string;
  user_email: string | null;
  user_role: string;
  user_first_name: string | null;
  user_last_name: string | null;
  user_business_name: string | null;
}

interface WalletsResponse {
  data: UserWallet[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

function formatCurrency(amount: number, currency: string) {
  return `${currency === "NGN" ? "₦" : "$"}${amount.toLocaleString()}`;
}

export default function AdminWallets() {
  const [data, setData] = useState<WalletsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const fetchWallets = useCallback(async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("accessToken");
      if (!token) { toast({ title: "Error", description: "Not authenticated", variant: "destructive" }); return; }
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/v1/admin/wallets/users?${params}`, {
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
  }, [page, search, toast]);

  useEffect(() => { fetchWallets(); }, [fetchWallets]);

  const wallets = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              All Wallets
            </CardTitle>
            <CardDescription>View and search all user wallets across the platform</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchWallets} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by phone, name, or business..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded" />)}
            </div>
          ) : wallets.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Wallet className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>No wallets found.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>User</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead className="text-right">Deposited</TableHead>
                    <TableHead className="text-right">Withdrawn</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wallets.map((w) => (
                    <TableRow key={w.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setLocation(`/admin/users/${w.user_id}`)}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {[w.user_first_name, w.user_last_name].filter(Boolean).join(" ") || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">{w.user_phone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{w.user_business_name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{w.user_role}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(w.balance, w.currency)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(w.pending_balance, w.currency)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(w.total_deposited, w.currency)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(w.total_withdrawn, w.currency)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); setLocation(`/admin/users/${w.user_id}`); }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {meta && totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {meta.total} wallet{meta.total !== 1 ? "s" : ""} — page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
