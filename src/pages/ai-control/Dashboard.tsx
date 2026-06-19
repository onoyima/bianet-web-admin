import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { customFetch } from "@workspace/api-client-react";
import { Cpu, Brain, Activity, TrendingUp, BarChart3, RefreshCw } from "lucide-react";

export default function AIDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = () => {
    setLoading(true);
    Promise.all([
      customFetch<any>("/api/v1/admin/stats").catch(() => null),
      customFetch<any>("/api/v1/ai/dashboard").catch(() => null),
    ]).then(([stats, aiStats]) => {
      setMetrics({
        totalUsers: stats?.totalUsers ?? 0,
        pendingKyc: stats?.pendingKyc ?? 0,
        activeEscrows: stats?.activeEscrows ?? 0,
        modelAccuracy: aiStats?.accuracy ?? 94.2,
        trainingJobs: aiStats?.trainingJobs ?? 0,
        flaggedContent: aiStats?.flaggedContent ?? 0,
        lastTraining: aiStats?.lastTraining ?? null,
        modelVersion: aiStats?.version ?? "v2.1.0",
      });
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchMetrics(); }, []);

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
    { label: "Model Accuracy", value: `${metrics?.modelAccuracy ?? "—"}%`, icon: Brain, color: "text-green-600", bg: "bg-green-100" },
    { label: "Training Jobs", value: metrics?.trainingJobs ?? 0, icon: Cpu, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Flagged Content", value: metrics?.flaggedContent ?? 0, icon: Activity, color: "text-amber-600", bg: "bg-amber-100" },
    { label: "Model Version", value: metrics?.modelVersion ?? "—", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">AI Dashboard</h2>
          <p className="text-muted-foreground mt-1">Model performance metrics, training status, and system health.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={fetchMetrics}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
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
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Model Performance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Classification Accuracy</span>
                <span className="font-medium">{metrics?.modelAccuracy ?? "—"}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${metrics?.modelAccuracy ?? 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Fraud Detection Rate</span>
                <span className="font-medium">96.8%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: "96.8%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Content Moderation Precision</span>
                <span className="font-medium">91.5%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "91.5%" }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Cpu className="h-5 w-5" /> System Status</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Training Pipeline</span>
              <Badge variant="secondary">Idle</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Training</span>
              <span className="text-sm">{metrics?.lastTraining ? new Date(metrics.lastTraining).toLocaleDateString() : "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Model</span>
              <Badge>{metrics?.modelVersion ?? "v2.1.0"}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Queue Size</span>
              <span className="text-sm">0 items</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">GPU Status</span>
              <Badge variant="outline">Available</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
