import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { customFetch } from "@workspace/api-client-react";
import { Handshake, ExternalLink } from "lucide-react";
import { Link } from "wouter";

const DEAL_STATUS_COLORS: Record<string, string> = {
  NEGOTIATING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  CONTRACT_SENT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  SIGNED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  DEPOSIT_PAID: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  IN_TRANSIT: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  DISPUTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export default function AdminDealsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-deals", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      return customFetch<any>("/api/v1/bartar/deals?" + params);
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Deal Management</h1>
          <p className="text-muted-foreground mt-1">Oversee all Bartar commodity deals across the platform.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {["", "NEGOTIATING", "SIGNED", "DEPOSIT_PAID", "IN_TRANSIT", "DELIVERED", "COMPLETED", "DISPUTED", "CANCELLED"].map((s) => (
          <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>
            {s || "All"}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : data?.data?.length > 0 ? (
        <div className="space-y-4">
          {data.data.map((deal: any) => (
            <Card key={deal.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Handshake className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{deal.commodityName}</span>
                        <Badge className={DEAL_STATUS_COLORS[deal.status]}>{deal.status}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
                        <span>{deal.quantityKg?.toLocaleString()} kg</span>
                        <span>{deal.currency} {deal.totalValue?.toLocaleString()}</span>
                        <span>Seller: {deal.sellerId?.substring(0, 8)}...</span>
                        <span>Buyer: {deal.buyerId?.substring(0, 8)}...</span>
                        <span>{new Date(deal.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <Link href={"/bartar/deals/" + deal.id}>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed rounded-lg bg-card">
          <p className="text-xl font-medium">No deals found</p>
        </div>
      )}
    </div>
  );
}
