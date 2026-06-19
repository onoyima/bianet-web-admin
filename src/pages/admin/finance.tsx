import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, CreditCard, CheckCircle, Clock, XCircle } from "lucide-react";

interface RevenueSummary {
  totalCommission: number;
  totalSubscription: number;
  totalFeatured: number;
  grandTotal: number;
  commissionCount: number;
  subscriptionCount: number;
}

interface DailyRevenue {
  date: string;
  revenue: number;
}

interface CommissionLedgerEntry {
  id: string;
  entityType: string;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  createdAt: string;
}

interface Subscription {
  id: string;
  vendorId: string;
  planId: string;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

interface PayoutRequest {
  id: string;
  vendorId: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface MonetizationResponse {
  summary: RevenueSummary;
  daily: DailyRevenue[];
  period: string;
}

interface CommissionsResponse {
  data: CommissionLedgerEntry[];
  aggregates: { totalGross: number; totalCommission: number; totalNet: number };
  meta: { page: number; limit: number; total: number; totalPages: number };
}

interface SubscriptionsResponse {
  summary: { total: number; active: number; pastDue: number; cancelled: number; expired: number };
  data: Subscription[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

interface PayoutsResponse {
  data: PayoutRequest[];
  aggregates: { pendingAmount: number; processingAmount: number; completedAmount: number };
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export default function AdminFinance() {
  const [period, setPeriod] = useState("30d");
  const [activeTab, setActiveTab] = useState("revenue");
  const [revenueData, setRevenueData] = useState<MonetizationResponse | null>(null);
  const [commissionsData, setCommissionsData] = useState<CommissionsResponse | null>(null);
  const [subscriptionsData, setSubscriptionsData] = useState<SubscriptionsResponse | null>(null);
  const [payoutsData, setPayoutsData] = useState<PayoutsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const { toast } = useToast();

  const fetchRevenue = useCallback(async () => {
    try {
      const token = sessionStorage.getItem("accessToken");
      const res = await fetch(`/api/v1/admin/monetization/revenue?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch revenue");
      setRevenueData(await res.json());
    } catch {
      toast({ title: "Error", description: "Failed to load revenue data", variant: "destructive" });
    }
  }, [period, toast]);

  const fetchCommissions = useCallback(async () => {
    try {
      const token = sessionStorage.getItem("accessToken");
      const res = await fetch(`/api/v1/admin/monetization/commissions?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch commissions");
      setCommissionsData(await res.json());
    } catch {
      toast({ title: "Error", description: "Failed to load commissions data", variant: "destructive" });
    }
  }, [page, toast]);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const token = sessionStorage.getItem("accessToken");
      const res = await fetch(`/api/v1/admin/monetization/subscriptions?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch subscriptions");
      setSubscriptionsData(await res.json());
    } catch {
      toast({ title: "Error", description: "Failed to load subscriptions data", variant: "destructive" });
    }
  }, [page, toast]);

  const fetchPayouts = useCallback(async () => {
    try {
      const token = sessionStorage.getItem("accessToken");
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/v1/admin/monetization/payouts?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch payouts");
      setPayoutsData(await res.json());
    } catch {
      toast({ title: "Error", description: "Failed to load payouts data", variant: "destructive" });
    }
  }, [page, statusFilter, toast]);

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([fetchRevenue(), fetchCommissions(), fetchSubscriptions(), fetchPayouts()]).finally(() => setLoading(false));
  }, [fetchRevenue, fetchCommissions, fetchSubscriptions, fetchPayouts]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (activeTab === "revenue") fetchRevenue();
    else if (activeTab === "commissions") fetchCommissions();
    else if (activeTab === "subscriptions") fetchSubscriptions();
    else if (activeTab === "payouts") fetchPayouts();
  }, [activeTab, period, page, statusFilter, fetchRevenue, fetchCommissions, fetchSubscriptions, fetchPayouts]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(amount);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      ACTIVE: { variant: "default", label: "Active" },
      COMPLETED: { variant: "default", label: "Completed" },
      PENDING: { variant: "outline", label: "Pending" },
      PROCESSING: { variant: "secondary", label: "Processing" },
      PAST_DUE: { variant: "destructive", label: "Past Due" },
      CANCELLED: { variant: "destructive", label: "Cancelled" },
      EXPIRED: { variant: "outline", label: "Expired" }
    };
    return variants[status] || { variant: "outline", label: status };
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "ACTIVE":
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "PENDING":
      case "PROCESSING":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-row justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance & Monetization</h1>
          <p className="text-muted-foreground">Track revenue, commissions, subscriptions, and payouts</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAll} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <Card key={i}><CardHeader><Skeleton className="h-4 w-32" /></CardHeader><CardContent><Skeleton className="h-10 w-24" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(revenueData?.summary.grandTotal || 0)}</div>
              <p className="text-xs text-muted-foreground">From commissions, subscriptions & featured listings</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Commissions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(revenueData?.summary.totalCommission || 0)}</div>
              <p className="text-xs text-muted-foreground">{revenueData?.summary.commissionCount} transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(revenueData?.summary.totalSubscription || 0)}</div>
              <p className="text-xs text-muted-foreground">{revenueData?.summary.subscriptionCount} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Featured Listings</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(revenueData?.summary.totalFeatured || 0)}</div>
              <p className="text-xs text-muted-foreground">Featured listing revenue</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="revenue" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Revenue</CardTitle>
              <CardDescription>Revenue over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">{Array.from({ length: 5 }).map((_,i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : (
                <div className="space-y-4">
                  <div className="h-[300px] w-full bg-slate-50 rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Chart placeholder</p>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revenueData?.daily.map((day, i) => (
                        <TableRow key={i}>
                          <TableCell>{new Date(day.date).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(day.revenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-row justify-between">
                <div>
                  <CardTitle>Commission Ledger</CardTitle>
                  <CardDescription>Track all commission transactions</CardDescription>
                </div>
                <div className="flex gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Gross</p>
                    <p className="font-bold">{formatCurrency(commissionsData?.aggregates.totalGross || 0)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Commission</p>
                    <p className="font-bold text-green-600">{formatCurrency(commissionsData?.aggregates.totalCommission || 0)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Net</p>
                    <p className="font-bold">{formatCurrency(commissionsData?.aggregates.totalNet || 0)}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">{Array.from({ length: 8 }).map((_,i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Entity Type</TableHead>
                        <TableHead>Gross Amount</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Net Amount</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissionsData?.data.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.entityType}</TableCell>
                          <TableCell>{formatCurrency(entry.grossAmount)}</TableCell>
                          <TableCell className="text-green-600">{formatCurrency(entry.commissionAmount)}</TableCell>
                          <TableCell>{formatCurrency(entry.netAmount)}</TableCell>
                          <TableCell className="text-xs">{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                    <span>Page {commissionsData?.meta.page} of {commissionsData?.meta.totalPages}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p-1)}>Previous</Button>
                      <Button variant="outline" size="sm" disabled={page >= (commissionsData?.meta.totalPages || 1)} onClick={() => setPage(p => p+1)}>Next</Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-row justify-between">
                <div>
                  <CardTitle>Subscriptions</CardTitle>
                  <CardDescription>Manage vendor subscriptions</CardDescription>
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-bold">{subscriptionsData?.summary.total}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="font-bold text-green-600">{subscriptionsData?.summary.active}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Past Due</p>
                    <p className="font-bold text-red-600">{subscriptionsData?.summary.pastDue}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">{Array.from({ length: 8 }).map((_,i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor ID</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptionsData?.data.map((sub) => {
                        const status = getStatusBadge(sub.status);
                        return (
                          <TableRow key={sub.id}>
                            <TableCell className="font-medium">{sub.vendorId}</TableCell>
                            <TableCell>{sub.planId}</TableCell>
                            <TableCell>
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </TableCell>
                            <TableCell className="text-xs">{new Date(sub.startDate).toLocaleDateString()}</TableCell>
                            <TableCell className="text-xs">{new Date(sub.endDate).toLocaleDateString()}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                    <span>Page {subscriptionsData?.meta.page} of {subscriptionsData?.meta.totalPages}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p-1)}>Previous</Button>
                      <Button variant="outline" size="sm" disabled={page >= (subscriptionsData?.meta.totalPages || 1)} onClick={() => setPage(p => p+1)}>Next</Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-row justify-between items-center">
                <div>
                  <CardTitle>Payout Requests</CardTitle>
                  <CardDescription>Manage vendor payout requests</CardDescription>
                </div>
                <div className="flex gap-4 items-center">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PROCESSING">Processing</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="font-bold text-yellow-600">{formatCurrency(payoutsData?.aggregates.pendingAmount || 0)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Processing</p>
                      <p className="font-bold text-blue-600">{formatCurrency(payoutsData?.aggregates.processingAmount || 0)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="font-bold text-green-600">{formatCurrency(payoutsData?.aggregates.completedAmount || 0)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">{Array.from({ length: 8 }).map((_,i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payoutsData?.data.map((payout) => {
                        const status = getStatusBadge(payout.status);
                        return (
                          <TableRow key={payout.id}>
                            <TableCell className="font-medium">{payout.vendorId}</TableCell>
                            <TableCell className="font-medium">{formatCurrency(payout.amount)}</TableCell>
                            <TableCell className="flex items-center gap-2">
                              {getStatusIcon(payout.status)}
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </TableCell>
                            <TableCell className="text-xs">{new Date(payout.createdAt).toLocaleDateString()}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                    <span>Page {payoutsData?.meta.page} of {payoutsData?.meta.totalPages}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p-1)}>Previous</Button>
                      <Button variant="outline" size="sm" disabled={page >= (payoutsData?.meta.totalPages || 1)} onClick={() => setPage(p => p+1)}>Next</Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
