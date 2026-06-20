import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Alert, AlertDescription, AlertTitle,
} from "@/components/ui/alert";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownToLine,
  ArrowLeftRight,
  Wallet,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  User,
  Building,
  FileText,
  Scale,
  ShoppingCart,
  Package,
  Banknote,
  History,
  ExternalLink,
  MapPin,
  Truck,
} from "lucide-react";

const TERMINAL_STATUSES = ["FUNDS_RELEASED", "REFUNDED", "CANCELLED", "ARBITRATION_SETTLED"];

const STATUS_BADGE: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: typeof Clock }> = {
  AWAITING_DEPOSIT: { variant: "outline", label: "Awaiting Deposit", icon: Clock },
  FUNDS_HELD: { variant: "secondary", label: "Funds Held", icon: Wallet },
  FUNDS_RELEASED: { variant: "default", label: "Released", icon: CheckCircle },
  IN_DISPUTE: { variant: "destructive", label: "In Dispute", icon: AlertTriangle },
  ARBITRATION_SETTLED: { variant: "secondary", label: "Arbitration Settled", icon: Scale },
  REFUNDED: { variant: "outline", label: "Refunded", icon: ArrowDownToLine },
  CANCELLED: { variant: "outline", label: "Cancelled", icon: XCircle },
};

interface Escrow {
  id: string;
  platform: string;
  orderId?: string | null;
  listingId?: string | null;
  buyerId?: string;
  sellerId?: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string | null;
  amount: string;
  currency: string;
  status: string;
  paymentReference?: string | null;
  payment_reference: string | null;
  disputeReason?: string | null;
  dispute_reason: string | null;
  arbitrationNotes?: string | null;
  arbitration_notes: string | null;
  depositedAt?: string | null;
  releasedAt?: string | null;
  createdAt?: string;
  created_at: string;
  updatedAt?: string;
  updated_at: string;
  buyerPhone?: string;
  buyer_phone?: string;
  buyerAvatarUrl?: string;
  buyer_avatar_url?: string;
  buyerFirstName?: string;
  buyer_first_name?: string;
  buyerLastName?: string;
  buyer_last_name?: string;
  buyerBusinessName?: string;
  buyer_business_name?: string;
  sellerPhone?: string;
  seller_phone?: string;
  sellerAvatarUrl?: string;
  seller_avatar_url?: string;
  sellerFirstName?: string;
  seller_first_name?: string;
  sellerLastName?: string;
  seller_last_name?: string;
  sellerBusinessName?: string;
  seller_business_name?: string;
  platformCommission?: string | null;
  logisticsFee?: string | null;
  netSellerPayout?: string | null;
  buyer?: { id: string; phone: string; firstName?: string; lastName?: string; businessName?: string; avatarUrl?: string };
  seller?: { id: string; phone: string; firstName?: string; lastName?: string; businessName?: string; avatarUrl?: string };
  ledger?: Array<{ id: string; type: string; amount: string; currency: string; direction: string; description?: string; createdAt: string }>;
  messages?: Array<{ id: string; content: string; senderId: string; senderName?: string; createdAt: string }>;
}

interface OrderDetail {
  id: string;
  buyerId?: string;
  vendorId?: string;
  commodity?: string;
  quantity?: number;
  unit?: string;
  total?: number;
  currency?: string;
  status?: string;
  createdAt?: string;
  buyerProfile?: { firstName?: string; lastName?: string; businessName?: string };
  vendorProfile?: { firstName?: string; lastName?: string; businessName?: string };
  events?: Array<{ id: string; eventType: string; oldStatus?: string; newStatus?: string; notes?: string; createdAt: string }>;
  shipment?: ShipmentSummary;
}

interface ShipmentSummary {
  id: string;
  status: string;
  trackingCode?: string;
  originAddress?: string;
  destinationAddress?: string;
  estimatedDeliveryAt?: string;
}

interface ListingSummary {
  id: string;
  title?: string;
  commodity?: string;
  quantity?: number;
  unit?: string;
  price?: number;
  currency?: string;
  status?: string;
  category?: string;
  sellerId?: string;
  sellerBusinessName?: string;
  description?: string;
  location?: string;
  images?: string[];
  createdAt?: string;
}

interface WalletInfo {
  id: string;
  balance: string;
  pendingBalance?: string;
  currency?: string;
  totalDeposited?: string;
  totalWithdrawn?: string;
  recentTransactions?: Array<{
    id: string;
    type: string;
    amount: string;
    status: string;
    description?: string;
    createdAt: string;
  }>;
}

interface AuditLog {
  id: string;
  action: string;
  adminName: string;
  entityType: string;
  entityId: string;
  notes?: string;
  result: string;
  createdAt: string;
}

function formatAmount(amount: string | number, currency: string) {
  const num = typeof amount === "string" ? Number(amount) : amount;
  return `${currency === "NGN" ? "₦" : "$"}${num.toLocaleString()}`;
}

function StatusTimeline({ status }: { status: string }) {
  const steps = [
    { key: "AWAITING_DEPOSIT", label: "Initiated" },
    { key: "FUNDS_HELD", label: "Funded" },
    { key: "FUNDS_RELEASED", label: "Completed" },
  ];

  const isTerminal = TERMINAL_STATUSES.includes(status);
  const currentIdx = steps.findIndex((s) => s.key === status);
  const activeIdx = status === "FUNDS_RELEASED" ? 2 : status === "REFUNDED" || status === "CANCELLED" ? -1 : currentIdx >= 0 ? currentIdx : -1;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const isCompleted = idx <= activeIdx;
          const isCurrent = idx === activeIdx && !isTerminal;
          const isActive = isCompleted || isCurrent;
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    isCompleted
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                      : isCurrent
                      ? "bg-primary/20 text-primary border-2 border-primary animate-pulse"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <CheckCircle className="h-5 w-5" /> : <span>{idx + 1}</span>}
                </div>
                <span className={`text-xs mt-2 font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 mb-6 transition-all duration-500 ${idx < activeIdx ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          );
        })}
      </div>

      {status === "IN_DISPUTE" && (
        <div className="mt-6">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md shadow-destructive/30">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <span className="text-xs mt-2 font-medium text-destructive">Dispute</span>
            </div>
            <div className="flex-1 h-0.5 bg-destructive mb-6" />
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                <Scale className="h-5 w-5" />
              </div>
              <span className="text-xs mt-2 font-medium text-muted-foreground">Resolution</span>
            </div>
          </div>
        </div>
      )}

      {isTerminal && status !== "FUNDS_RELEASED" && (
        <div className="mt-4 pt-4 border-t border-border text-center">
          <Badge variant={STATUS_BADGE[status]?.variant ?? "outline"} className="text-xs px-3 py-1">
            {STATUS_BADGE[status]?.label ?? status}
          </Badge>
          <p className="text-xs text-muted-foreground mt-2">
            {status === "REFUNDED" ? "Funds were returned to the buyer"
            : status === "CANCELLED" ? "This transaction was cancelled"
            : status === "ARBITRATION_SETTLED" ? "Dispute resolved via arbitration"
            : ""}
          </p>
        </div>
      )}
    </div>
  );
}

function PartyCard({ role, name, phone, avatarUrl, id }: { role: string; name: string; phone?: string; avatarUrl?: string; id?: string }) {
  return (
    <Card className="flex-1">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {role === "Buyer" ? <User className="h-4 w-4 text-primary" /> : <Building className="h-4 w-4 text-secondary-foreground" />}
          {role}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover border-2 border-border" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold border-2 border-border">
              {(name[0] ?? "?").toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{name}</p>
            {phone && <p className="text-xs text-muted-foreground">{phone}</p>}
          </div>
        </div>
        {id && <p className="text-[10px] font-mono text-muted-foreground truncate">ID: {id}</p>}
      </CardContent>
    </Card>
  );
}

export default function AdminEscrowDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [listing, setListing] = useState<ListingSummary | null>(null);
  const [buyerWallet, setBuyerWallet] = useState<WalletInfo | null>(null);
  const [sellerWallet, setSellerWallet] = useState<WalletInfo | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [extraLoading, setExtraLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [arbitrateOpen, setArbitrateOpen] = useState(false);
  const [arbitrateData, setArbitrateData] = useState({ decision: "", notes: "", payoutBuyer: "", payoutSeller: "" });
  const [defaultTab, setDefaultTab] = useState("overview");

  const getToken = () => sessionStorage.getItem("accessToken");

  const fetchEscrow = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) { toast({ title: "Error", description: "Not authenticated", variant: "destructive" }); return; }
      const res = await fetch(`/api/v1/admin/escrow/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEscrow(data);

      setExtraLoading(true);
      const extraPromises: Promise<unknown>[] = [];

      const orderId = data.orderId || null;
      const listingId = data.listingId || data.listing_id || null;
      const buyerId = data.buyerId || data.buyer_id;
      const sellerId = data.sellerId || data.seller_id;

      const fetchJson = async (url: string) => {
        const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!r.ok) return null;
        return r.json();
      };

      if (orderId) {
        extraPromises.push(
          fetchJson(`/api/v1/admin/orders/${orderId}`).then((d) => { if (d) setOrder(d); })
        );
      }

      if (listingId) {
        const endpoint = data.platform === "SEED"
          ? `/api/v1/admin/listings/seed/${listingId}`
          : `/api/v1/admin/listings/bartar/${listingId}`;
        extraPromises.push(
          fetchJson(endpoint).then((d) => { if (d) setListing(d); })
        );
      }

      if (buyerId) {
        extraPromises.push(
          fetchJson(`/api/v1/admin/wallets/users/${buyerId}`).then((d) => { if (d) setBuyerWallet(d); })
        );
      }

      if (sellerId) {
        extraPromises.push(
          fetchJson(`/api/v1/admin/wallets/vendors/${sellerId}`).then((d) => { if (d) setSellerWallet(d); })
        );
      }

      extraPromises.push(
        fetchJson(`/api/v1/admin/logs?entityType=escrow&entityId=${id}&limit=10`).then((d) => { if (d) setAuditLogs(d.data ?? []); })
      );

      await Promise.allSettled(extraPromises);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
      setExtraLoading(false);
    }
  }, [id, toast]);

  useEffect(() => { fetchEscrow(); }, [fetchEscrow]);

  const handleAction = async (action: string) => {
    if (!escrow) return;
    setActionLoading(true);
    try {
      const token = getToken();
      let url = `/api/v1/admin/escrow/${id}/${action}`;
      let body: Record<string, unknown> = {};

      if (action === "arbitrate") {
        url = `/api/v1/admin/escrow/${id}/resolve`;
        body = { decision: arbitrateData.decision, notes: arbitrateData.notes };
        if (arbitrateData.decision === "SPLIT") {
          body.payoutBuyer = arbitrateData.payoutBuyer;
          body.payoutSeller = arbitrateData.payoutSeller;
        }
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Action failed");
      }

      toast({ title: "Success", description: `Escrow ${action} completed` });
      setArbitrateOpen(false);
      fetchEscrow();
      queryClient.invalidateQueries();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!escrow) {
    return (
      <div className="text-center py-20">
        <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
        <h2 className="text-xl font-semibold">Escrow not found</h2>
        <p className="text-muted-foreground mt-2 text-sm">This escrow transaction may have been deleted.</p>
        <Button variant="outline" className="mt-6" onClick={() => setLocation("/admin/escrow")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Escrow
        </Button>
      </div>
    );
  }

  const statusCfg = STATUS_BADGE[escrow.status] ?? { variant: "outline" as const, label: escrow.status, icon: Clock };
  const StatusIcon = statusCfg.icon;
  const buyer = escrow.buyer;
  const seller = escrow.seller;
  const buyerId = escrow.buyerId || escrow.buyer_id || buyer?.id;
  const sellerId = escrow.sellerId || escrow.seller_id || seller?.id;
  const buyerName = buyer?.businessName || escrow.buyerBusinessName || escrow.buyer_business_name
    || (buyer?.firstName || escrow.buyerFirstName || escrow.buyer_first_name
      ? `${buyer?.firstName || escrow.buyerFirstName || escrow.buyer_first_name || ""} ${buyer?.lastName || escrow.buyerLastName || escrow.buyer_last_name || ""}`.trim()
      : buyerId || "Unknown Buyer");
  const sellerName = seller?.businessName || escrow.sellerBusinessName || escrow.seller_business_name
    || (seller?.firstName || escrow.sellerFirstName || escrow.seller_first_name
      ? `${seller?.firstName || escrow.sellerFirstName || escrow.seller_first_name || ""} ${seller?.lastName || escrow.sellerLastName || escrow.seller_last_name || ""}`.trim()
      : sellerId || "Unknown Seller");
  const isTerminal = TERMINAL_STATUSES.includes(escrow.status);
  const orderId = escrow.orderId || null;
  const listingId = escrow.listingId || escrow.listing_id || null;

  const tabs = [
    { value: "overview", label: "Overview", icon: Wallet },
    { value: "order", label: "Order", icon: ShoppingCart, disabled: !orderId && !order },
    { value: "listing", label: "Listing", icon: Package, disabled: !listingId && !listing },
    { value: "wallets", label: "Wallets", icon: Banknote, disabled: !buyerWallet && !sellerWallet },
    { value: "activity", label: "Activity", icon: History, disabled: auditLogs.length === 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setLocation("/admin/escrow")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Escrow Detail</h1>
              <Badge variant={statusCfg.variant} className="text-sm px-3 py-1">
                <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                {statusCfg.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground font-mono mt-0.5">{escrow.id}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Transaction Progress
          </CardTitle>
          <CardDescription>{escrow.platform === "SEED" ? "Seed platform" : "Bartar platform"} escrow timeline</CardDescription>
        </CardHeader>
        <CardContent>
          <StatusTimeline status={escrow.status} />
        </CardContent>
      </Card>

      <Tabs value={defaultTab} onValueChange={setDefaultTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} disabled={tab.disabled} className="gap-2">
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  Financial Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 text-sm">
                  <div>
                    <dt className="text-muted-foreground text-xs">Contract Value</dt>
                    <dd className="font-bold text-3xl mt-1 text-foreground">{formatAmount(escrow.amount, escrow.currency)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Platform</dt>
                    <dd className="font-medium mt-1"><Badge variant="outline">{escrow.platform}</Badge></dd>
                  </div>
                  {escrow.platformCommission && (
                    <>
                      <Separator className="sm:col-span-2" />
                      <div><dt className="text-muted-foreground text-xs">Platform Commission</dt><dd className="font-medium mt-1">{formatAmount(escrow.platformCommission, escrow.currency)}</dd></div>
                      {escrow.logisticsFee && <div><dt className="text-muted-foreground text-xs">Logistics Fee</dt><dd className="font-medium mt-1">{formatAmount(escrow.logisticsFee, escrow.currency)}</dd></div>}
                      {escrow.netSellerPayout && <div><dt className="text-muted-foreground text-xs">Net Seller Payout</dt><dd className="font-semibold text-lg mt-1 text-primary">{formatAmount(escrow.netSellerPayout, escrow.currency)}</dd></div>}
                    </>
                  )}
                  <Separator className="sm:col-span-2" />
                  <div><dt className="text-muted-foreground text-xs">Payment Ref</dt><dd className="font-mono text-xs mt-0.5 break-all">{escrow.paymentReference || escrow.payment_reference || "—"}</dd></div>
                  <div><dt className="text-muted-foreground text-xs">Listing ID</dt><dd className="font-mono text-xs mt-0.5">{listingId || "—"}</dd></div>
                  <div><dt className="text-muted-foreground text-xs">Created</dt><dd className="font-medium mt-0.5">{new Date(escrow.createdAt || escrow.created_at).toLocaleString()}</dd></div>
                  <div><dt className="text-muted-foreground text-xs">Last Updated</dt><dd className="font-medium mt-0.5">{new Date(escrow.updatedAt || escrow.updated_at).toLocaleString()}</dd></div>
                  {escrow.depositedAt && <div className="sm:col-span-2"><dt className="text-muted-foreground text-xs">Deposited At</dt><dd className="font-medium mt-0.5">{new Date(escrow.depositedAt).toLocaleString()}</dd></div>}
                </dl>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <PartyCard role="Buyer" name={buyerName} phone={buyer?.phone || escrow.buyerPhone || escrow.buyer_phone} avatarUrl={buyer?.avatarUrl || escrow.buyerAvatarUrl || escrow.buyer_avatar_url} id={buyerId} />
              <PartyCard role="Seller" name={sellerName} phone={seller?.phone || escrow.sellerPhone || escrow.seller_phone} avatarUrl={seller?.avatarUrl || escrow.sellerAvatarUrl || escrow.seller_avatar_url} id={sellerId} />
            </div>
          </div>

          {(escrow.disputeReason || escrow.dispute_reason || escrow.arbitrationNotes || escrow.arbitration_notes) && (
            <>
              {(escrow.disputeReason || escrow.dispute_reason) && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Dispute Filed</AlertTitle>
                  <AlertDescription>{escrow.disputeReason || escrow.dispute_reason}</AlertDescription>
                </Alert>
              )}
              {(escrow.arbitrationNotes || escrow.arbitration_notes) && (
                <Alert>
                  <Scale className="h-4 w-4" />
                  <AlertTitle>Arbitration Resolution</AlertTitle>
                  <AlertDescription>{escrow.arbitrationNotes || escrow.arbitration_notes}</AlertDescription>
                </Alert>
              )}
            </>
          )}

          {!isTerminal && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-primary" />
                  Actions
                </CardTitle>
                <CardDescription>Manage this escrow transaction</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {escrow.status === "FUNDS_HELD" && (
                    <>
                      <Button onClick={() => handleAction("release")} disabled={actionLoading}>
                        <ArrowUpRight className="h-4 w-4 mr-2" />
                        {actionLoading ? "Processing..." : "Release Funds"}
                      </Button>
                      <Button variant="secondary" onClick={() => handleAction("refund")} disabled={actionLoading}>
                        <ArrowDownToLine className="h-4 w-4 mr-2" />
                        {actionLoading ? "Processing..." : "Refund to Buyer"}
                      </Button>
                    </>
                  )}
                  {escrow.status === "IN_DISPUTE" && (
                    <Button onClick={() => setArbitrateOpen(true)} disabled={actionLoading}>
                      <ArrowLeftRight className="h-4 w-4 mr-2" />
                      Resolve Dispute
                    </Button>
                  )}
                  {escrow.status === "AWAITING_DEPOSIT" && (
                    <Button variant="secondary" onClick={() => handleAction("cancel")} disabled={actionLoading}>
                      <XCircle className="h-4 w-4 mr-2" />
                      {actionLoading ? "Processing..." : "Cancel Escrow"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Order Tab */}
        <TabsContent value="order" className="mt-6 space-y-6">
          {extraLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ) : order ? (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-primary" />
                    Order #{order.id.substring(0, 8)}
                  </CardTitle>
                  <CardDescription>Order linked to this escrow</CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-muted-foreground text-xs">Commodity</dt>
                      <dd className="font-medium mt-0.5">{order.commodity || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs">Quantity</dt>
                      <dd className="font-medium mt-0.5">{order.quantity ? `${order.quantity} ${order.unit || ""}` : "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs">Total</dt>
                      <dd className="font-medium mt-0.5">{order.total ? formatAmount(order.total, order.currency || "NGN") : "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs">Status</dt>
                      <dd className="mt-0.5"><Badge variant="outline">{order.status || "—"}</Badge></dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs">Buyer</dt>
                      <dd className="font-medium mt-0.5 text-sm">
                        {order.buyerProfile
                          ? (order.buyerProfile.businessName || `${order.buyerProfile.firstName || ""} ${order.buyerProfile.lastName || ""}`.trim() || order.buyerId)
                          : order.buyerId || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs">Vendor</dt>
                      <dd className="font-medium mt-0.5 text-sm">
                        {order.vendorProfile
                          ? (order.vendorProfile.businessName || `${order.vendorProfile.firstName || ""} ${order.vendorProfile.lastName || ""}`.trim() || order.vendorId)
                          : order.vendorId || "—"}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {order.shipment && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Truck className="h-4 w-4 text-primary" />
                      Linked Shipment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{order.shipment.originAddress || "—"} → {order.shipment.destinationAddress || "—"}</span>
                      </div>
                      <Badge variant="outline">{order.shipment.status}</Badge>
                    </div>
                    {order.shipment.trackingCode && (
                      <p className="text-xs font-mono text-muted-foreground mt-2">Tracking: {order.shipment.trackingCode}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {order.events && order.events.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <History className="h-4 w-4 text-primary" />
                      Order Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {order.events.map((event) => (
                        <div key={event.id} className="flex items-start gap-3 text-sm">
                          <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{event.eventType}</p>
                            {event.notes && <p className="text-xs text-muted-foreground">{event.notes}</p>}
                            <p className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-10 text-muted-foreground">
                <ShoppingCart className="h-8 w-8 mx-auto mb-3 opacity-20" />
                <p>No order linked to this escrow.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Listing Tab */}
        <TabsContent value="listing" className="mt-6 space-y-6">
          {extraLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          ) : listing ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  {listing.title || listing.commodity || "Listing"}
                </CardTitle>
                <CardDescription>Listing linked to this escrow</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground text-xs">Description</dt>
                    <dd className="mt-0.5">{listing.description || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Price</dt>
                    <dd className="font-medium mt-0.5">{listing.price ? formatAmount(listing.price, listing.currency || "NGN") : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Quantity</dt>
                    <dd className="font-medium mt-0.5">{listing.quantity ? `${listing.quantity} ${listing.unit || ""}` : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Category</dt>
                    <dd className="mt-0.5">{listing.category || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Status</dt>
                    <dd className="mt-0.5"><Badge variant="outline">{listing.status || "—"}</Badge></dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Location</dt>
                    <dd className="mt-0.5">{listing.location || "—"}</dd>
                  </div>
                  {listing.sellerBusinessName && (
                    <div>
                      <dt className="text-muted-foreground text-xs">Seller</dt>
                      <dd className="font-medium mt-0.5">{listing.sellerBusinessName}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-muted-foreground text-xs">Created</dt>
                    <dd className="mt-0.5">{listing.createdAt ? new Date(listing.createdAt).toLocaleDateString() : "—"}</dd>
                  </div>
                </dl>
                {listing.images && listing.images.length > 0 && (
                  <div className="mt-4 flex gap-2 overflow-x-auto">
                    {listing.images.map((img, i) => (
                      <img key={i} src={img} alt="" className="h-20 w-20 rounded-lg object-cover border border-border shrink-0" />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-10 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-3 opacity-20" />
                <p>No listing linked to this escrow.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Wallets Tab */}
        <TabsContent value="wallets" className="mt-6 space-y-6">
          {extraLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Buyer Wallet
                  </CardTitle>
                  <CardDescription>{buyerName}</CardDescription>
                </CardHeader>
                <CardContent>
                  {buyerWallet ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Balance</p>
                        <p className="text-2xl font-bold">{formatAmount(buyerWallet.balance, buyerWallet.currency || "NGN")}</p>
                      </div>
                      {buyerWallet.pendingBalance && (
                        <div>
                          <p className="text-xs text-muted-foreground">Pending Balance</p>
                          <p className="text-sm font-medium">{formatAmount(buyerWallet.pendingBalance, buyerWallet.currency || "NGN")}</p>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Total Deposited: {buyerWallet.totalDeposited ? formatAmount(buyerWallet.totalDeposited, buyerWallet.currency || "NGN") : "—"}</span>
                        <span>Total Withdrawn: {buyerWallet.totalWithdrawn ? formatAmount(buyerWallet.totalWithdrawn, buyerWallet.currency || "NGN") : "—"}</span>
                      </div>
                      {buyerWallet.recentTransactions && buyerWallet.recentTransactions.length > 0 && (
                        <div className="pt-2">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Recent Transactions</p>
                          <div className="space-y-1.5">
                            {buyerWallet.recentTransactions.slice(0, 5).map((tx) => (
                              <div key={tx.id} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <Badge variant={tx.type === "DEPOSIT" ? "default" : tx.type === "PAYMENT" ? "secondary" : "outline"} className="text-[9px] px-1 py-0">{tx.type}</Badge>
                                  <span className="truncate">{tx.description || ""}</span>
                                </div>
                                <span className={tx.type === "DEPOSIT" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                  {tx.type === "DEPOSIT" ? "+" : "-"}{formatAmount(tx.amount, buyerWallet.currency || "NGN")}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No wallet data available</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building className="h-4 w-4 text-primary" />
                    Seller Wallet
                  </CardTitle>
                  <CardDescription>{sellerName}</CardDescription>
                </CardHeader>
                <CardContent>
                  {sellerWallet ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Balance</p>
                        <p className="text-2xl font-bold">{formatAmount(sellerWallet.balance, sellerWallet.currency || "NGN")}</p>
                      </div>
                      {sellerWallet.pendingBalance && (
                        <div>
                          <p className="text-xs text-muted-foreground">Pending Balance</p>
                          <p className="text-sm font-medium">{formatAmount(sellerWallet.pendingBalance, sellerWallet.currency || "NGN")}</p>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Total Deposited: {sellerWallet.totalDeposited ? formatAmount(sellerWallet.totalDeposited, sellerWallet.currency || "NGN") : "—"}</span>
                        <span>Total Withdrawn: {sellerWallet.totalWithdrawn ? formatAmount(sellerWallet.totalWithdrawn, sellerWallet.currency || "NGN") : "—"}</span>
                      </div>
                      {sellerWallet.recentTransactions && sellerWallet.recentTransactions.length > 0 && (
                        <div className="pt-2">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Recent Transactions</p>
                          <div className="space-y-1.5">
                            {sellerWallet.recentTransactions.slice(0, 5).map((tx) => (
                              <div key={tx.id} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <Badge variant={tx.type === "DEPOSIT" ? "default" : tx.type === "PAYMENT" ? "secondary" : "outline"} className="text-[9px] px-1 py-0">{tx.type}</Badge>
                                  <span className="truncate">{tx.description || ""}</span>
                                </div>
                                <span className={tx.type === "DEPOSIT" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                  {tx.type === "DEPOSIT" ? "+" : "-"}{formatAmount(tx.amount, sellerWallet.currency || "NGN")}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No wallet data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-6 space-y-6">
          {extraLoading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : auditLogs.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  Audit Trail
                </CardTitle>
                <CardDescription>All admin actions related to this escrow</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium text-xs">{log.action}</TableCell>
                        <TableCell className="text-xs">{log.adminName || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={log.result === "SUCCESS" ? "default" : "destructive"} className="text-[10px] px-1.5 py-0">
                            {log.result}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{log.notes || "—"}</TableCell>
                        <TableCell className="text-xs">{new Date(log.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-10 text-muted-foreground">
                <History className="h-8 w-8 mx-auto mb-3 opacity-20" />
                <p>No audit logs for this escrow.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {arbitrateOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-destructive" />
                Arbitrate Dispute
              </CardTitle>
              <CardDescription>Resolve this disputed escrow transaction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Decision</Label>
                <Select value={arbitrateData.decision} onValueChange={(v) => setArbitrateData((d) => ({ ...d, decision: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select decision" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RELEASE_TO_SELLER">Release to Seller</SelectItem>
                    <SelectItem value="REFUND_TO_BUYER">Refund to Buyer</SelectItem>
                    <SelectItem value="SPLIT">Split</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {arbitrateData.decision === "SPLIT" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Payout to Buyer</Label>
                    <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={arbitrateData.payoutBuyer} onChange={(e) => setArbitrateData((d) => ({ ...d, payoutBuyer: e.target.value }))} placeholder="0.00" />
                  </div>
                  <div>
                    <Label>Payout to Seller</Label>
                    <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={arbitrateData.payoutSeller} onChange={(e) => setArbitrateData((d) => ({ ...d, payoutSeller: e.target.value }))} placeholder="0.00" />
                  </div>
                </div>
              )}
              <div>
                <Label>Arbitration Notes (min 20 chars)</Label>
                <Textarea value={arbitrateData.notes} onChange={(e) => setArbitrateData((d) => ({ ...d, notes: e.target.value }))} rows={3} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setArbitrateOpen(false)}>Cancel</Button>
                <Button onClick={() => handleAction("arbitrate")} disabled={actionLoading || !arbitrateData.decision || arbitrateData.notes.length < 20}>
                  {actionLoading ? "Processing..." : "Submit Arbitration"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
