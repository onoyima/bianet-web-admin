import { useGetMe } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { HeadphonesIcon, FileCheck, AlertTriangle, Users, TrendingUp, Clock, CheckCircle2 } from "lucide-react";

const statCards = [
  {
    label: "Open Tickets",
    value: 0,
    icon: HeadphonesIcon,
    gradient: "from-blue-500 to-indigo-600",
    desc: "Tickets needing attention",
  },
  {
    label: "Active Disputes",
    value: 0,
    icon: AlertTriangle,
    gradient: "from-amber-500 to-orange-600",
    desc: "Disputes to resolve",
  },
  {
    label: "Resolved Today",
    value: 0,
    icon: CheckCircle2,
    gradient: "from-emerald-500 to-green-600",
    desc: "Tickets closed today",
  },
  {
    label: "Avg Response Time",
    value: "45m",
    icon: Clock,
    gradient: "from-rose-500 to-red-600",
    desc: "Ticket response time",
  },
];

export default function SupportDashboard() {
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
        <h1 className="text-3xl font-display font-bold tracking-tight">Support Dashboard</h1>
        <p className="text-muted-foreground mt-1">Handle user tickets and resolve disputes.</p>
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
              <CardTitle>Recent Tickets</CardTitle>
              <CardDescription>Latest support requests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                No open tickets
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
              <CardTitle>Open Disputes</CardTitle>
              <CardDescription>Escrow disputes needing resolution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                No open disputes
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}