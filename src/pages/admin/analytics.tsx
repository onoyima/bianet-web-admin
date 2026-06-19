import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { customFetch } from "@workspace/api-client-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import {
  Users, Package, Handshake, DollarSign, TrendingUp, Activity,
  CheckCircle2, XCircle, Clock, Crown,
} from "lucide-react";

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState("30d");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics", period],
    queryFn: async () => {
      return customFetch<any>("/api/v1/admin/analytics/overview?period=" + period);
    },
  });

  const s = data?.summary;
  const userGrowth = data?.users || [];

  const statCards = [
    { title: "Total Users", value: s?.totalUsers ?? 0, icon: Users, color: "text-blue-500", sub: "+" + (s?.newUsers24h ?? 0) + " today" },
    { title: "Active Listings", value: (s?.activeSeedListings ?? 0) + (s?.activeBartarListings ?? 0), icon: Package, color: "text-green-500", sub: s?.activeSeedListings + " seed, " + s?.activeBartarListings + " bartar" },
    { title: "Total Deals", value: s?.totalDeals ?? 0, icon: Handshake, color: "text-purple-500", sub: s?.completedDeals + " completed" },
    { title: "Escrow Volume", value: "NGN " + ((s?.escrowVolume ?? 0)).toLocaleString(), icon: DollarSign, color: "text-yellow-500", sub: s?.escrowCompleted + " released" },
    { title: "Commission Earned", value: "NGN " + ((s?.totalCommission ?? 0)).toLocaleString(), icon: TrendingUp, color: "text-cyan-500", sub: s?.totalCommissionCharges + " charges" },
    { title: "Active Subs", value: s?.activeSubscriptions ?? 0, icon: Crown, color: "text-secondary", sub: s?.totalSubscriptions + " total" },
    { title: "KYC Approved", value: s?.kycApproved ?? 0, icon: CheckCircle2, color: "text-emerald-500", sub: s?.kycPending + " pending" },
    { title: "Disputes", value: s?.escrowDisputed ?? 0, icon: Activity, color: "text-red-500", sub: s?.disputedDeals + " deal disputes" },
  ];

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
                      <Icon className={"h-8 w-8 " + card.color} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">User Growth</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#16a34a" fill="#16a34a20" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Deals Overview</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: "Total", value: s?.totalDeals ?? 0 },
                    { name: "Completed", value: s?.completedDeals ?? 0 },
                    { name: "Disputed", value: s?.disputedDeals ?? 0 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">KYC Status</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: "Approved", value: s?.kycApproved ?? 0, fill: "#16a34a" },
                    { name: "Rejected", value: s?.kycRejected ?? 0, fill: "#dc2626" },
                    { name: "Pending", value: s?.kycPending ?? 0, fill: "#eab308" },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {[["#16a34a"], ["#dc2626"], ["#eab308"]].map((entry, idx) => (
                        <rect key={idx} fill={entry[0]} />
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
                    { name: "Seed Active", value: s?.activeSeedListings ?? 0 },
                    { name: "Bartar Active", value: s?.activeBartarListings ?? 0 },
                    { name: "Featured", value: s?.featuredListings ?? 0 },
                    { name: "Escrows", value: s?.escrowTotal ?? 0 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
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
