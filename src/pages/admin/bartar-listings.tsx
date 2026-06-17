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
import { RefreshCw, Building2 } from "lucide-react";

const STATUS_BADGE: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  ACTIVE: { variant: "default", label: "Active" },
  SOLD: { variant: "secondary", label: "Sold" },
  EXPIRED: { variant: "outline", label: "Expired" },
  SUSPENDED: { variant: "destructive", label: "Suspended" },
  DRAFT: { variant: "outline", label: "Draft" },
};

interface BartarListing {
  id: string;
  sellerId: string;
  commodity: string;
  quantity: string;
  unit: string;
  price: string;
  currency: string;
  qualityGrade: string | null;
  status: string;
  originCountry: string;
  createdAt: string;
}

interface ListingsResponse {
  data: BartarListing[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export default function AdminBartarListings() {
  const [data, setData] = useState<ListingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const { toast } = useToast();

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("accessToken");
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/v1/admin/bartar-listings?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      setData(await res.json());
    } catch {
      toast({ title: "Error", description: "Failed to load bartar listings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, toast]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    try {
      const token = sessionStorage.getItem("accessToken");
      const res = await fetch(`/api/v1/admin/listings/bartar/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast({ title: "Success", description: `Listing ${newStatus.toLowerCase()}` });
      fetchListings();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Bartar Listings</CardTitle>
            <CardDescription>Manage all commodity exchange listings across the platform</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchListings} disabled={loading}>
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
                <SelectItem value=" ">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="SOLD">Sold</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
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
                    <TableHead>Commodity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Origin</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell className="font-medium">{listing.commodity}</TableCell>
                      <TableCell>{(listing.currency === "NGN" ? "₦" : "$")}{Number(listing.price).toLocaleString()}</TableCell>
                      <TableCell>{Number(listing.quantity).toLocaleString()} {listing.unit}</TableCell>
                      <TableCell>{listing.qualityGrade ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE[listing.status]?.variant ?? "outline"}>
                          {STATUS_BADGE[listing.status]?.label ?? listing.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{listing.originCountry}</TableCell>
                      <TableCell className="text-xs">{new Date(listing.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => toggleStatus(listing.id, listing.status)}>
                          {listing.status === "SUSPENDED" ? "Activate" : "Suspend"}
                        </Button>
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
              <Building2 className="h-8 w-8 mx-auto mb-3 opacity-20" />
              <p>No bartar listings found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
