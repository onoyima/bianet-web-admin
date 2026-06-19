import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { customFetch } from "@workspace/api-client-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell,
} from "recharts";
import {
  Users, Package, Handshake, DollarSign, TrendingUp, Activity,
  CheckCircle2, Crown,
} from "lucide-react";

const ROLE_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#06b6d4", "#ec4899"];
const ROLE_LABELS: Record<string, string> = {
  FARMER: "Farmer", TRADER: "Trader", EXPORTER: "Exporter",
  IMPORTER: "Importer", CONSUMER: "Consumer", LOGISTICS_PROVIDER: "Logistics",
};

function fm(n: number): string {
  if (n >= 1_000_000) return "₦" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return "₦" + (n / 1_000).toFixed(1) + "K";
  return "₦" + n.toLocaleString();
}

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState("30d");

  const { data: overview, isLoading: l1 } = useQuery<any>({
    queryKey: ["admin-analytics", period],
    queryFn: () => customFetch("/api/v1/admin/analytics/overview?period=" + period),
    retry: 1,
  });

  const { data: revenueData, isLoading: l2 } = useQuery<any>({
    queryKey: ["admin-revenue-analytics", period],
    queryFn: () => customFetch("/api/v1/admin/analytics/revenue?period=" + period),
    retry: 1,
  });

  const { data: userData, isLoading: l3 } = useQuery<any>({
    queryKey: ["admin-users-analytics", period],
    queryFn: () => customFetch("/api/v1/admin/analytics/users?period=" + period),
    retry: 1,
  });

  const s = overview?.summary ?? {};
  const userGrowth: { date: string; count: number }[] = overview?.users ?? [];
  const dailyRev: { date: string; revenue: number }[] = revenueData?.daily ?? [];
  const revSummary = revenueData?.summary ?? {};
  const userSummary = userData?.summary ?? {};
  const userGrowthData: { date: string; new_users: number }[] = userData?.growth ?? [];
  const roleDist: { role: string; count: number }[] = userData?.roleDistribution ?? [];

  const chartUserGrowth = userGrowth.length > 0 ? userGrowth : userGrowthData.map(d => ({ date: d.date, count: d.new_users }));

  const statCards = [
    { title: "Total Users", value: s.totalUsers ?? 0, icon: Users, color: "text-blue-500", sub: "+" + (s.newUsers24h ?? 0) + " today" },
    { title: "Active Listings", value: (s.activeSeedListings ?? 0) + (s.activeBartarListings ?? 0), icon: Package, color: "text-green-500", sub: (s.activeSeedListings ?? 0) + " seed, " + (s.activeBartarListings ?? 0) + " bartar" },
    { title: "Total Deals", value: s.totalDeals ?? 0, icon: Handshake, color: "text-purple-500", sub: (s.completedDeals ?? 0) + " completed" },
    { title: "Escrow Volume", value: "NGN " + ((s.escrowVolume ?? 0)).toLocaleString(), icon: DollarSign, color: "text-yellow-500", sub: (s.escrowCompleted ?? 0) + " released" },
    { title: "Commission Earned", value: "NGN " + ((revSummary.totalRevenue ?? 0)).toLocaleString(), icon: TrendingUp, color: "text-cyan-500", sub: (revSummary.totalTransactions ?? 0) + " transactions" },
    { title: "Active Subs", value: s.activeSubscriptions ?? 0, icon: Crown, color: "text-secondary", sub: (s.totalSubscriptions ?? 0) + " total" },
    { title: "KYC Approved", value: s.kycApproved ?? 0, icon: CheckCircle2, color: "text-emerald-500", sub: (s.kycPending ?? 0) + " pending" },
    { title: "Disputes", value: (s.escrowDisputed ?? 0) + (s.disputedDeals ?? 0), icon: Activity, color: "text-red-500", sub: (s.disputedDeals ?? 0) + " deal disputes" },
  ];

  const isLoading = l1 || l2 || l3;

  const rolePieData = roleDist.length > 0
    ? roleDist.map((r, i) => ({ name: ROLE_LABELS[r.role] ?? r.role, value: r.count, fill: ROLE_COLORS[i % ROLE_COLORS.length] }))
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">Platform-wide metrics, growth, and revenue overview.</p>
        </div>
        <div className="flex gap-2">
          {["7d", "30d", "90d"].map((p) => (
            <Button key={p} variant={period === p ? "default" : "outline"} size="sm" onClick={() => setPeriod(p)}>
              {p}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.title}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">{card.title}</p>
                        <p className="text-2xl font-bold">{card.value}</p>
                        <p className="text-xs text-muted-foreground">{card.sub}</p>
                      </div>
                      <div className={`p-3 rounded-full ${card.color.replace('text-', 'bg-').replace('500', '100')}`}>
                        <Icon className={"h-6 w-6 " + card.color} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-lg">User Growth</CardTitle></CardHeader>
              <CardContent>
                {chartUserGrowth.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartUserGrowth}>
                      <defs>
                        <linearGradient id="colAna" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#16a34a" fillOpacity={1} fill="url(#colAna)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">No data yet</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">User Roles</CardTitle></CardHeader>
              <CardContent>
                {rolePieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={rolePieData}
                        cx="50%" cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {rolePieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">No data yet</div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Revenue Trend</CardTitle></CardHeader>
              <CardContent>
                {dailyRev.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyRev}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => "₦" + (v / 1000).toFixed(0) + "k"} />
                      <Tooltip formatter={(v: number) => [fm(v), "Revenue"]} />
                      <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">No revenue data yet</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Deals Overview</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: "Total", value: s.totalDeals ?? 0 },
                    { name: "Completed", value: s.completedDeals ?? 0 },
                    { name: "Disputed", value: s.disputedDeals ?? 0 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {["#8b5cf6", "#10b981", "#ef4444"].map((color, idx) => (
                        <Cell key={`cell-${idx}`} fill={color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">KYC Status</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: "Approved", value: s.kycApproved ?? 0, fill: "#16a34a" },
                    { name: "Rejected", value: s.kycRejected ?? 0, fill: "#dc2626" },
                    { name: "Pending", value: s.kycPending ?? 0, fill: "#eab308" },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {["#16a34a", "#dc2626", "#eab308"].map((color, idx) => (
                        <Cell key={`cell-${idx}`} fill={color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Listings & Escrow</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: "Seed Active", value: s.activeSeedListings ?? 0 },
                    { name: "Bartar Active", value: s.activeBartarListings ?? 0 },
                    { name: "Featured", value: s.featuredListings ?? 0 },
                    { name: "Escrows", value: s.escrowTotal ?? 0 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {["#06b6d4", "#8b5cf6", "#f59e0b", "#10b981"].map((color, idx) => (
                        <Cell key={`cell-${idx}`} fill={color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
