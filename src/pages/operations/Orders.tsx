import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { customFetch } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Package, ChevronLeft, ChevronRight } from "lucide-react";

const STATUSES = ["ALL", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELLED", "REFUNDED"];

export default function OpsOrders() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [orders, setOrders] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const res = await customFetch<any>(`/api/v1/admin/orders?${params}`);
      setOrders(res.data ?? []);
      setMeta(res.meta);
    } catch (err: any) {
      toast({ title: "Failed to load orders", description: err?.data?.error ?? err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page, statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await customFetch(`/api/v1/admin/orders/seed/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast({ title: "Order status updated" });
      fetchOrders();
    } catch (err: any) {
      toast({ title: "Failed to update status", description: err?.data?.error ?? err.message, variant: "destructive" });
    }
  };

  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Order Management</h2>
        <p className="text-muted-foreground mt-1">Track, process, and manage orders.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Orders</CardTitle>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s === "ALL" ? "All Statuses" : s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded" />)}</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><Package className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>No orders found.</p></div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Order ID</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o: any) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.id?.substring(0, 8)}...</TableCell>
                      <TableCell className="text-sm">{o.buyer?.name ?? o.buyer?.phone ?? "—"}</TableCell>
                      <TableCell>{o.commodity ?? "—"}</TableCell>
                      <TableCell>{o.quantity} {o.unit}</TableCell>
                      <TableCell className="font-medium">{o.currency || "NGN"} {o.total?.toLocaleString() ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={o.status === "COMPLETED" || o.status === "DELIVERED" ? "default" : o.status === "PENDING" ? "secondary" : o.status === "CANCELLED" || o.status === "REFUNDED" ? "destructive" : "outline"}>
                          {o.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{o.platform ?? "seed"}</TableCell>
                      <TableCell className="text-right">
                        <Select onValueChange={(v) => updateStatus(o.id, v)}>
                          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Update" /></SelectTrigger>
                          <SelectContent>
                            {STATUSES.filter((s) => s !== "ALL").map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {meta && totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">{meta.total} orders — page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
