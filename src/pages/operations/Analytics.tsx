import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { customFetch } from "@workspace/api-client-react";
import { BarChart3, TrendingUp, Users, DollarSign, ShoppingCart, Activity } from "lucide-react";

export default function OpsAnalytics() {
  const [period, setPeriod] = useState("month");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    customFetch<any>(`/api/v1/admin/analytics/overview?period=${period}`)
      .then((data) => setStats(data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [period]);

  const metrics = [
    { label: "Total Revenue", value: stats?.totalRevenue, icon: DollarSign, format: true },
    { label: "Total Users", value: stats?.totalUsers, icon: Users },
    { label: "Total Orders", value: stats?.totalOrders, icon: ShoppingCart },
    { label: "Active Listings", value: stats?.activeListings, icon: BarChart3 },
    { label: "Growth Rate", value: stats?.growthRate, icon: TrendingUp, suffix: "%" },
    { label: "Engagement", value: stats?.engagement, icon: Activity, suffix: "%" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Analytics</h2>
          <p className="text-muted-foreground mt-1">Business metrics, charts, and data exports.</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Period" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map(({ label, value, icon: Icon, format: isCurrency, suffix }) => (
          <Card key={label} className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <div className="p-2 rounded-full bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {value != null
                  ? isCurrency
                    ? `NGN ${Number(value).toLocaleString()}`
                    : suffix
                      ? `${value}${suffix}`
                      : Number(value).toLocaleString()
                  : "—"}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Revenue Overview</CardTitle></CardHeader>
          <CardContent>
            {stats?.revenueBreakdown ? (
              <div className="space-y-3">
                {Object.entries(stats.revenueBreakdown).map(([key, val]: any) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm capitalize text-muted-foreground">{key.replace(/_/g, " ")}</span>
                    <Badge variant="outline">NGN {Number(val).toLocaleString()}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No revenue data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Platform Activity</CardTitle></CardHeader>
          <CardContent>
            {stats?.activitySummary ? (
              <div className="space-y-3">
                {Object.entries(stats.activitySummary).map(([key, val]: any) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm capitalize text-muted-foreground">{key.replace(/_/g, " ")}</span>
                    <Badge>{Number(val).toLocaleString()}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No activity data available</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
