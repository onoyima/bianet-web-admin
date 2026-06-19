import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { customFetch } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ShoppingCart, Users, AlertTriangle, Activity, ArrowRight, Package, Scale } from "lucide-react";

export default function OpsDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [flaggedItems, setFlaggedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      customFetch<any>("/api/v1/admin/stats").catch(() => null),
      customFetch<any>("/api/v1/admin/orders?limit=5&page=1").catch(() => null),
      customFetch<any>("/api/v1/admin/logs?limit=5&page=1").catch(() => null),
    ]).then(([statsRes, ordersRes, logsRes]) => {
      setStats(statsRes);
      setRecentOrders(ordersRes?.data ?? []);
      setFlaggedItems(logsRes?.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Orders", value: recentOrders.length, icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Active Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-green-600", bg: "bg-green-100" },
    { label: "Flagged Items", value: flaggedItems.length, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100" },
    { label: "Pending KYC", value: stats?.pendingKyc ?? 0, icon: Activity, color: "text-amber-600", bg: "bg-amber-100" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-display font-bold">Operations Dashboard</h2>
        <p className="text-muted-foreground mt-1">Overview of orders, users, and system health.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <div className={`p-2 rounded-full ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Recent Orders
            </CardTitle>
            <Link href="/operations/orders">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No recent orders</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id?.substring(0, 8)}...</TableCell>
                      <TableCell>
                        <Badge variant={order.status === "COMPLETED" ? "default" : order.status === "PENDING" ? "secondary" : "outline"}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.currency || "NGN"} {order.total?.toLocaleString() ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <Link href="/admin/logs">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {flaggedItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No recent activity</div>
            ) : (
              <div className="space-y-3">
                {flaggedItems.map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{log.action}</Badge>
                      <span className="text-muted-foreground text-xs">
                        {log.adminName ?? log.adminId?.substring(0, 8)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
