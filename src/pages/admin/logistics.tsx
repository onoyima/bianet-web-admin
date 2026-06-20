import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { RefreshCw, Truck, Eye } from "lucide-react";

const STATUS_BADGE: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  PENDING: { variant: "outline", label: "Pending" },
  ASSIGNED: { variant: "secondary", label: "Assigned" },
  PICKED_UP: { variant: "secondary", label: "Picked Up" },
  IN_TRANSIT: { variant: "default", label: "In Transit" },
  DELIVERED: { variant: "default", label: "Delivered" },
  RETURNED: { variant: "destructive", label: "Returned" },
  CANCELLED: { variant: "outline", label: "Cancelled" },
};

interface Shipment {
  id: string;
  escrowId: string;
  logisticsProviderId: string | null;
  status: string;
  trackingCode: string | null;
  originAddress: string | null;
  destinationAddress: string | null;
  estimatedDeliveryAt: string | null;
  createdAt: string;
}

interface Provider {
  id: string;
  userId: string;
  companyName: string;
  phone: string;
  isVerified: boolean;
}

interface ShipmentsResponse {
  data: Shipment[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export default function AdminLogistics() {
  const [data, setData] = useState<ShipmentsResponse | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("accessToken");
      if (!token) { toast({ title: "Error", description: "Not authenticated", variant: "destructive" }); return; }
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      const [shipRes, provRes] = await Promise.all([
        fetch(`/api/v1/admin/shipments?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/v1/admin/logistics-providers", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (!shipRes.ok) {
        const err = await shipRes.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${shipRes.status}`);
      }
      if (provRes.ok) {
        const provData = await provRes.json();
        setProviders(provData.data ?? []);
      }
      setData(await shipRes.json());
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, toast]);

  useEffect(() => { fetchShipments(); }, [fetchShipments]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Logistics & Shipments</CardTitle>
            <CardDescription>Track and manage all shipments across the platform</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchShipments} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                <SelectItem value="PICKED_UP">Picked Up</SelectItem>
                <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="RETURNED">Returned</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : data && data.data.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Est. Delivery</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((shipment) => {
                    const provider = providers.find((p) => p.id === shipment.logisticsProviderId);
                    return (
                      <TableRow
                        key={shipment.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setLocation(`/admin/logistics/${shipment.id}`)}
                      >
                        <TableCell className="font-mono text-xs">{shipment.trackingCode ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_BADGE[shipment.status]?.variant ?? "outline"}>
                            {STATUS_BADGE[shipment.status]?.label ?? shipment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{provider?.companyName ?? "—"}</TableCell>
                        <TableCell className="text-xs">
                          {shipment.estimatedDeliveryAt ? new Date(shipment.estimatedDeliveryAt).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell className="text-xs">{new Date(shipment.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); setLocation(`/admin/logistics/${shipment.id}`); }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
              <Truck className="h-8 w-8 mx-auto mb-3 opacity-20" />
              <p>No shipments found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
