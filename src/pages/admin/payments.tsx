import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { CircleDollarSign, TrendingUp, AlertTriangle, Clock, ArrowUpRight, Wallet, Banknote, Loader2 } from "lucide-react";
import { adminApi } from "../../lib/admin-api";

interface TransactionRow {
  reference: string;
  user: string;
  type: string;
  amount: number;
  currency: string;
  provider: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  date: string;
}

interface PayoutRow {
  vendorName: string;
  amount: number;
  currency: string;
  bankName: string;
  accountNumber: string;
  date: string;
}

export default function AdminPayments() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("transactions");
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loadingTxns, setLoadingTxns] = useState(false);
  const [loadingPayouts, setLoadingPayouts] = useState(false);

  const loadTransactions = useCallback(async () => {
    setLoadingTxns(true);
    try {
      const res = await adminApi.payments.list();
      setTransactions(
        (res.data as any[]).map((t: any) => ({
          reference: t.reference,
          user: t.user_business_name ?? t.user_phone ?? "—",
          type: t.type,
          amount: t.amount,
          currency: t.currency,
          provider: t.provider,
          status: t.status,
          date: t.created_at ?? t.createdAt,
        })),
      );
    } catch (e: any) {
      toast({ title: "Failed to load transactions", description: e.message, variant: "destructive" });
    } finally {
      setLoadingTxns(false);
    }
  }, [toast]);

  const loadPayouts = useCallback(async () => {
    setLoadingPayouts(true);
    try {
      const res = await adminApi.payments.pendingPayouts();
      setPayouts(
        (res.data as any[]).map((p: any) => ({
          vendorName: p.vendor_business_name ?? p.vendor?.businessName ?? "—",
          amount: p.amount,
          currency: p.currency,
          bankName: p.bank_name ?? p.bankName,
          accountNumber: p.bank_account_no ?? p.accountNumber,
          date: p.created_at ?? p.createdAt,
        })),
      );
    } catch (e: any) {
      toast({ title: "Failed to load payouts", description: e.message, variant: "destructive" });
    } finally {
      setLoadingPayouts(false);
    }
  }, [toast]);

  useEffect(() => {
    if (activeTab === "transactions") loadTransactions();
    if (activeTab === "payouts") loadPayouts();
  }, [activeTab, loadTransactions, loadPayouts]);

  const handleProcessPayout = (payout: PayoutRow) => {
    toast({ title: "Payout processing", description: `Processing ${payout.currency === "NGN" ? "₦" : "$"}${Number(payout.amount).toLocaleString()} to ${payout.vendorName}.` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Payments Oversight</h2>
        <p className="text-muted-foreground mt-1">Monitor all financial transactions and manage payouts</p>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="transactions">All Transactions</TabsTrigger>
              <TabsTrigger value="payouts">Pending Payouts</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-4">
          {activeTab === "transactions" && (
            loadingTxns ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wallet className="h-8 w-8 mx-auto mb-3 opacity-20" />
                <p>No transactions found.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => (
                    <TableRow key={txn.reference}>
                      <TableCell className="font-mono text-xs">{txn.reference}</TableCell>
                      <TableCell className="text-sm">{txn.user}</TableCell>
                      <TableCell className="text-sm">{txn.type}</TableCell>
                      <TableCell className="font-mono text-sm">{txn.currency === "NGN" ? "₦" : "$"}{Number(txn.amount).toLocaleString()}</TableCell>
                      <TableCell><Badge variant="outline">{txn.provider}</Badge></TableCell>
                      <TableCell>
                        <Badge
                          variant={txn.status === "SUCCESS" ? "default" : txn.status === "FAILED" ? "destructive" : "outline"}
                          className={txn.status === "PENDING" ? "text-amber-600 border-amber-300 bg-amber-50" : ""}
                        >
                          {txn.status === "SUCCESS" && <ArrowUpRight className="h-3 w-3 mr-1 inline" />}
                          {txn.status === "FAILED" && <AlertTriangle className="h-3 w-3 mr-1 inline" />}
                          {txn.status === "PENDING" && <Clock className="h-3 w-3 mr-1 inline" />}
                          {txn.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(txn.date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          )}

          {activeTab === "payouts" && (
            loadingPayouts ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : payouts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Banknote className="h-8 w-8 mx-auto mb-3 opacity-20" />
                <p>No pending payouts.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Account No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{p.vendorName}</TableCell>
                      <TableCell className="font-mono">{p.currency === "NGN" ? "₦" : "$"}{Number(p.amount).toLocaleString()}</TableCell>
                      <TableCell>{p.bankName}</TableCell>
                      <TableCell className="font-mono text-xs">{p.accountNumber}</TableCell>
                      <TableCell className="text-sm">{new Date(p.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => handleProcessPayout(p)}>
                          <ArrowUpRight className="h-4 w-4 mr-1" />
                          Process
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
