import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { customFetch } from "@workspace/api-client-react";
import { Link } from "wouter";
import { HeadphonesIcon, TicketCheck, AlertTriangle, Clock, ArrowRight, MessageSquare, Users, CheckCircle2, Bell } from "lucide-react";

export default function SupportDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      customFetch<any>("/api/v1/admin/escrow?limit=5").catch(() => null),
      customFetch<any>("/api/v1/admin/notifications?limit=5").catch(() => null),
    ]).then(([escrows, notifications]) => {
      setStats({
        openDisputes: escrows?.data?.filter((e: any) => e.status === "DISPUTED").length ?? 0,
        totalEscrows: escrows?.data?.length ?? 0,
        recentNotifications: notifications?.data ?? [],
        recentEscrows: escrows?.data ?? [],
      });
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
    { label: "Open Disputes", value: stats?.openDisputes ?? 0, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100" },
    { label: "Total Escrows", value: stats?.totalEscrows ?? 0, icon: TicketCheck, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Resolved", value: stats?.resolved ?? 0, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
    { label: "Response Time", value: "—", icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-display font-bold">Support Dashboard</h2>
        <p className="text-muted-foreground mt-1">Overview of open tickets, response times, and team performance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <div className={`p-2 rounded-full ${bg}`}><Icon className={`h-4 w-4 ${color}`} /></div>
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
            <CardTitle className="text-lg flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Recent Escrows</CardTitle>
            <Link href="/support/disputes"><Button variant="ghost" size="sm" className="gap-1">View All <ArrowRight className="h-4 w-4" /></Button></Link>
          </CardHeader>
          <CardContent>
            {(!stats?.recentEscrows || stats.recentEscrows.length === 0) ? (
              <div className="text-center py-8 text-muted-foreground"><TicketCheck className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>No escrows yet.</p></div>
            ) : (
              <div className="space-y-3">
                {stats.recentEscrows.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant={e.status === "DISPUTED" ? "destructive" : e.status === "HELD" ? "secondary" : "outline"} className="text-xs">{e.status}</Badge>
                      <span className="font-mono text-xs">{e.reference ?? e.id?.substring(0, 8)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2"><Bell className="h-5 w-5" /> Recent Notifications</CardTitle>
            <Link href="/admin/notifications"><Button variant="ghost" size="sm" className="gap-1">View All <ArrowRight className="h-4 w-4" /></Button></Link>
          </CardHeader>
          <CardContent>
            {(!stats?.recentNotifications || stats.recentNotifications.length === 0) ? (
              <div className="text-center py-8 text-muted-foreground"><Bell className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>No notifications yet.</p></div>
            ) : (
              <div className="space-y-3">
                {stats.recentNotifications.map((n: any) => (
                  <div key={n.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{n.type}</Badge>
                      <span className="text-muted-foreground text-xs truncate max-w-[200px]">{n.message ?? n.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleDateString()}</span>
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
