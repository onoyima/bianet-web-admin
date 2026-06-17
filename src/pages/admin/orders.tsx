import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, Scale, Clock, CheckCircle2, Truck, XCircle, AlertTriangle, ArrowLeftRight, Loader2 } from "lucide-react";
import { adminApi } from "../../lib/admin-api";

interface OrderRow {
  id: string;
  buyer: string;
  vendor: string;
  commodity: string;
  quantity: number;
  unit: string;
  total: number;
  currency: string;
  status: string;
  date: string;
  platform: string;
  escrowRef: string;
  timeline: { event: string; date: string; completed: boolean }[];
}

const STATUS_ORDER: Record<string, number> = {
  Pending: 0,
  Paid: 1,
  Confirmed: 2,
  "In Transit": 3,
  Delivered: 4,
  Disputed: 5,
  Cancelled: 6,
};

const STATUS_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  Pending: "outline",
  Paid: "secondary",
  Confirmed: "default",
  "In Transit": "secondary",
  Delivered: "default",
  Disputed: "destructive",
  Cancelled: "outline",
};

const ALL_STATUSES = ["All", "Pending", "Paid", "Confirmed", "In Transit", "Delivered", "Disputed", "Cancelled"];

export default function AdminOrders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.orders.list({ status: statusFilter === "All" ? undefined : statusFilter });
      setOrders(
        (res.data as any[]).map((o: any) => ({
          id: o.id,
          buyer: o.buyer.name,
          vendor: o.vendor.name,
          commodity: o.commodity,
          quantity: o.quantity,
          unit: o.unit,
          total: o.total,
          currency: o.currency,
          status: o.status,
          date: o.date,
          platform: o.platform,
          escrowRef: o.escrowRef,
          timeline: o.timeline ?? [],
        })),
      );
    } catch (e: any) {
      toast({ title: "Failed to load orders", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const filtered = orders.filter((o) => {
    const matchesSearch = !search.trim() ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.buyer.toLowerCase().includes(search.toLowerCase()) ||
      o.vendor.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const openDetail = async (order: OrderRow) => {
    try {
      const detail = await adminApi.orders.get(order.id);
      setSelectedOrder({
        ...order,
        timeline: detail.timeline ?? order.timeline,
        escrowRef: detail.escrowRef ?? order.escrowRef,
      });
    } catch {
      setSelectedOrder(order);
    }
    setDetailOpen(true);
  };

  const handleResolveDispute = (order: OrderRow) => {
    toast({ title: "Dispute resolution", description: `Initiating arbitration for order ${order.id}.` });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Order Management</CardTitle>
          <CardDescription>Monitor and manage all marketplace orders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by order ID, buyer, or vendor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Scale className="h-8 w-8 mx-auto mb-3 opacity-20" />
              <p>No orders match your criteria.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs font-medium">{o.id}</TableCell>
                    <TableCell className="text-sm">{o.buyer}</TableCell>
                    <TableCell className="text-sm">{o.vendor}</TableCell>
                    <TableCell className="text-sm">{o.quantity} {o.unit} {o.commodity}</TableCell>
                    <TableCell className="font-mono text-sm">{o.currency} {Number(o.total).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE[o.status] ?? "outline"}>{o.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{new Date(o.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openDetail(o)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {o.status === "Disputed" && (
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleResolveDispute(o)}>
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Resolve Dispute
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Detail — {selectedOrder?.id}</DialogTitle>
            <DialogDescription>Full details and timeline for this order</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block">Buyer</span>
                  <span className="font-medium">{selectedOrder.buyer}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Vendor</span>
                  <span className="font-medium">{selectedOrder.vendor}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Commodity</span>
                  <span className="font-medium">{selectedOrder.commodity}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Quantity</span>
                  <span className="font-medium">{selectedOrder.quantity} {selectedOrder.unit}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Total</span>
                  <span className="font-medium">{selectedOrder.currency} {Number(selectedOrder.total).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Platform</span>
                  <Badge variant="outline">{selectedOrder.platform}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground block">Escrow Ref</span>
                  <span className="font-mono text-xs">{selectedOrder.escrowRef}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Status</span>
                  <Badge variant={STATUS_BADGE[selectedOrder.status] ?? "outline"}>{selectedOrder.status}</Badge>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Order Timeline
                </h4>
                <div className="space-y-3">
                  {selectedOrder.timeline.map((entry, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${entry.completed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          {entry.completed
                            ? <CheckCircle2 className="h-3 w-3" />
                            : <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />}
                        </div>
                        {idx < selectedOrder.timeline.length - 1 && <div className="w-px h-6 bg-border" />}
                      </div>
                      <div className="pb-3">
                        <p className={`text-sm font-medium ${entry.completed ? "text-foreground" : "text-muted-foreground"}`}>{entry.event}</p>
                        {entry.date && <p className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString()}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
