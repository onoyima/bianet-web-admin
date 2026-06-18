import { useGetMe } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Cpu, Shield, Activity, BookOpen, TrendingUp, Clock, CheckCircle2 } from "lucide-react";

const statCards = [
  {
    label: "Moderation Actions",
    value: 0,
    icon: Shield,
    gradient: "from-blue-500 to-indigo-600",
    desc: "Content moderation actions",
  },
  {
    label: "Model Requests",
    value: 0,
    icon: Cpu,
    gradient: "from-purple-500 to-violet-600",
    desc: "AI model requests today",
  },
  {
    label: "Training Data Sets",
    value: 5,
    icon: BookOpen,
    gradient: "from-emerald-500 to-green-600",
    desc: "Active training datasets",
  },
  {
    label: "Avg Inference Time",
    value: "250ms",
    icon: Clock,
    gradient: "from-rose-500 to-red-600",
    desc: "Model response time",
  },
];

export default function AIDashboard() {
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
        <h1 className="text-3xl font-display font-bold tracking-tight">AI Control Center</h1>
        <p className="text-muted-foreground mt-1">Manage and monitor AI models, moderation, and training data.</p>
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
              <CardTitle>Model Performance</CardTitle>
              <CardDescription>Recent AI model performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                Model monitoring will appear here
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
              <CardTitle>Recent Moderation</CardTitle>
              <CardDescription>Latest content moderation actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                No moderation actions yet
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}