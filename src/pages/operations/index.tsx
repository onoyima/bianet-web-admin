import { useGetMe } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Activity, Users, Package, AlertTriangle, TrendingUp, BarChart3, Clock, CheckCircle2 } from "lucide-react";

const statCards = [
  {
    label: "Active Users (24h)",
    value: 0,
    icon: Users,
    gradient: "from-blue-500 to-indigo-600",
    desc: "Users online today",
  },
  {
    label: "Pending Orders",
    value: 0,
    icon: Package,
    gradient: "from-amber-500 to-orange-600",
    desc: "Orders needing action",
  },
  {
    label: "Fraud Alerts",
    value: 0,
    icon: AlertTriangle,
    gradient: "from-rose-500 to-red-600",
    desc: "Alerts to review",
  },
  {
    label: "Avg Resolution Time",
    value: "2h",
    icon: Clock,
    gradient: "from-emerald-500 to-green-600",
    desc: "Ticket resolution time",
  },
];

export default function OpsDashboard() {
  const { data: user, isLoading: isLoadingUser } = useGetMe();

  if (isLoadingUser) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-72 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-display font-bold tracking-tight">Operations Dashboard</h1>
        <p className="text-muted-foreground mt-1">Monitor platform activity and handle urgent tasks.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
            whileHover={{ y: -4 }}
          >
            <Card className="group relative overflow-hidden border-border/60 hover:border-border transition-all hover:shadow-xl hover:shadow-primary/5">
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-[0.03] group-hover:opacity-[0.06] transition-opacity`} />
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">{card.value}</div>
                <p className="text-sm font-medium text-foreground">{card.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Orders placed in the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                No recent orders
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Fraud Alerts</CardTitle>
              <CardDescription>Potential suspicious activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                No alerts at this time
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}