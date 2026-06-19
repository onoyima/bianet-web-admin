import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { customFetch } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Users, FileCheck, CircleDollarSign, Scale, Sprout, ArrowLeftRight,
  BookOpen, TrendingUp, ShoppingCart, Handshake, DollarSign, Activity,
  ChevronRight, Newspaper
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const COLORS = {
  primary: "#16a34a",
  purple: "#8b5cf6",
  blue: "#3b82f6",
  amber: "#f59e0b",
  red: "#ef4444",
  cyan: "#06b6d4",
};

function fm(n: number): string {
  if (n >= 1_000_000) return "₦" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return "₦" + (n / 1_000).toFixed(1) + "K";
  return "₦" + n.toLocaleString();
}

function StatCard({ label, value, icon: Icon, color, bg, format }: {
  label: string; value: number; icon: any; color: string; bg: string; format?: "currency";
}) {
  return (
    <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className={`p-2 rounded-full ${bg}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {format === "currency" ? fm(value) : value.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const [period, setPeriod] = useState("30d");

  const { data: stats, isLoading: l1 } = useQuery<any>({
    queryKey: ["admin-stats"],
    queryFn: () => customFetch("/api/v1/admin/stats"),
    retry: 1,
  });

  const { data: overview, isLoading: l2 } = useQuery<any>({
    queryKey: ["admin-analytics-overview", period],
    queryFn: () => customFetch(`/api/v1/admin/analytics/overview?period=${period}`),
    retry: 1,
  });

  const { data: revenue, isLoading: l3 } = useQuery<any>({
    queryKey: ["admin-revenue", period],
    queryFn: () => customFetch(`/api/v1/admin/monetization/revenue?period=${period}`),
    retry: 1,
  });

  const { data: recentOrders } = useQuery<any>({
    queryKey: ["admin-recent-orders"],
    queryFn: () => customFetch("/api/v1/admin/orders?limit=5"),
    retry: false,
  });

  const { data: pendingPayouts } = useQuery<any>({
    queryKey: ["admin-pending-payouts"],
    queryFn: () => customFetch("/api/v1/admin/payments/pending-payouts?limit=5"),
    retry: false,
  });

  const { data: recentLogs } = useQuery<any>({
    queryKey: ["admin-recent-logs"],
    queryFn: () => customFetch("/api/v1/admin/system/logs?limit=10"),
    retry: false,
  });

  const s = stats ?? {};
  const o = overview?.summary ?? {};
  const r = revenue?.summary ?? {};
  const userGrowth: { date: string; count: number }[] = overview?.users ?? [];
  const dailyRev: { date: string; revenue: number }[] = revenue?.daily ?? [];
  const orders = recentOrders?.data ?? [];
  const payouts = pendingPayouts?.data ?? [];
  const logs = recentLogs?.data ?? [];

  const statCards = [
    { label: "Total Users", value: s.totalUsers ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Pending KYC", value: s.pendingKyc ?? 0, icon: FileCheck, color: "text-amber-600", bg: "bg-amber-100" },
    { label: "Active Escrows", value: s.activeEscrows ?? 0, icon: CircleDollarSign, color: "text-green-600", bg: "bg-green-100" },
    { label: "Revenue", value: s.totalRevenue ?? 0, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-100", format: "currency" as const },
    { label: "Seed Listings", value: s.seedListings ?? 0, icon: Sprout, color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Bartar Listings", value: s.bartarListings ?? 0, icon: ArrowLeftRight, color: "text-violet-600", bg: "bg-violet-100" },
    { label: "Educational", value: s.educationalContent ?? 0, icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-100" },
    { label: "Disputes", value: s.disputedEscrows ?? 0, icon: Scale, color: "text-red-600", bg: "bg-red-100" },
  ];

  const dealsChart = [
    { name: "Total", value: o.totalDeals ?? 0, fill: COLORS.purple },
    { name: "Completed", value: o.completedDeals ?? 0, fill: COLORS.primary },
    { name: "Disputed", value: o.disputedDeals ?? 0, fill: COLORS.red },
  ];

  const listingsChart = [
    { name: "Seed Active", value: o.activeSeedListings ?? 0, fill: COLORS.primary },
    { name: "Bartar Active", value: o.activeBartarListings ?? 0, fill: COLORS.purple },
    { name: "Featured", value: o.featuredListings ?? 0, fill: COLORS.amber },
    { name: "Escrows", value: o.escrowTotal ?? 0, fill: COLORS.cyan },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Platform overview, recent activity, and key metrics.</p>
        </div>
        <div className="flex gap-2">
          {["7d", "30d", "90d"].map((p) => (
            <Button key={p} variant={period === p ? "default" : "outline"} size="sm" onClick={() => setPeriod(p)}>
              {p}
            </Button>
          ))}
        </div>
      </div>

      {l1 || l2 || l3 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-72" /><Skeleton className="h-72" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-72" /><Skeleton className="h-72" />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((c) => <StatCard key={c.label} {...c} />)}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">User Growth</CardTitle>
                <CardDescription>New user registrations over time</CardDescription>
              </CardHeader>
              <CardContent>
                {userGrowth.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={userGrowth}>
                      <defs>
                        <linearGradient id="ucg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#16a34a" fillOpacity={1} fill="url(#ucg)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">No user growth data yet</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenue Trend</CardTitle>
                <CardDescription>Daily commission + subscription revenue</CardDescription>
              </CardHeader>
              <CardContent>
                {dailyRev.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={dailyRev}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => "₦" + (v / 1000).toFixed(0) + "k"} />
                      <Tooltip formatter={(v: number) => [fm(v), "Revenue"]} />
                      <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">No revenue data yet</div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Deals Overview</CardTitle>
                <CardDescription>{o.totalDeals ?? 0} total deals on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={dealsChart}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {dealsChart.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Listings & Escrow</CardTitle>
                <CardDescription>Active listings and escrow transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={listingsChart}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {listingsChart.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Recent Orders</CardTitle>
                  <CardDescription>Latest {orders.length} seed orders</CardDescription>
                </div>
                <Link href="/admin/orders">
                  <Button variant="ghost" size="sm">
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {orders.length > 0 ? (
                  <div className="space-y-2">
                    {orders.map((o: any, i: number) => (
                      <div key={o.id ?? i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{o.id?.slice(0, 8) ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">{o.status ?? "—"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">₦{(o.total ?? 0).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">No recent orders</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Pending Payouts</CardTitle>
                  <CardDescription>{pendingPayouts?.meta?.total ?? 0} pending requests</CardDescription>
                </div>
                <Link href="/admin/payments">
                  <Button variant="ghost" size="sm">
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {payouts.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex gap-3 mb-4">
                      <Badge variant="secondary" className="text-xs">
                        Pending: {fm(pendingPayouts?.aggregates?.pendingAmount ?? 0)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Processing: {fm(pendingPayouts?.aggregates?.processingAmount ?? 0)}
                      </Badge>
                    </div>
                    {payouts.map((p: any, i: number) => (
                      <div key={p.id ?? i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{p.id?.slice(0, 8) ?? "—"}</p>
                            <p className="text-xs text-muted-foreground capitalize">{p.status ?? "—"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">₦{(p.amount ?? 0).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">No pending payouts</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity Log
              </CardTitle>
              <CardDescription>Latest admin actions across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length > 0 ? (
                <div className="space-y-1">
                  {logs.map((log: any, i: number) => (
                    <div key={log.id ?? i} className="flex items-center gap-3 py-2 border-b border-border last:border-0 text-sm">
                      <Badge variant="outline" className="text-xs font-mono shrink-0">{log.action ?? "—"}</Badge>
                      <span className="text-muted-foreground truncate flex-1">
                        {log.adminName ?? "Admin"} — {log.entityType ?? ""} {log.entityId?.slice(0, 8) ?? ""}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">No recent activity</div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
