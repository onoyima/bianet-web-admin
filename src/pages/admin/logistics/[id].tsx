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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  RefreshCw,
  Truck,
  MapPin,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  User,
  Building,
  Phone,
  Navigation,
  FileText,
  ExternalLink,
  Eye,
  DollarSign,
  Wallet,
} from "lucide-react";

const TRACKING_STEPS = [
  { key: "PENDING", label: "Order Placed", icon: Package },
  { key: "ASSIGNED", label: "Provider Assigned", icon: User },
  { key: "PICKED_UP", label: "Picked Up", icon: Package },
  { key: "IN_TRANSIT", label: "In Transit", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: CheckCircle },
];

const STATUS_BADGE: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  PENDING: { variant: "outline", label: "Pending" },
  ASSIGNED: { variant: "secondary", label: "Assigned" },
  PICKED_UP: { variant: "secondary", label: "Picked Up" },
  IN_TRANSIT: { variant: "default", label: "In Transit" },
  DELIVERED: { variant: "default", label: "Delivered" },
  RETURNED: { variant: "destructive", label: "Returned" },
  CANCELLED: { variant: "outline", label: "Cancelled" },
};

interface Shipment {
  id: string;
  escrowId: string;
  logisticsProviderId: string | null;
  status: string;
  trackingCode: string | null;
  verificationCode: string | null;
  costKobo: number | null;
  originAddress: string | null;
  destinationAddress: string | null;
  billOfLadingUrl: string | null;
  sgsCertificateUrl: string | null;
  shippingManifestUrl: string | null;
  inspectionReportUrl: string | null;
  estimatedDeliveryAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface Provider {
  id: string;
  userId: string;
  companyName: string;
  phone: string;
  isVerified: boolean;
}

interface LinkedEscrow {
  id: string;
  platform: string;
  amount: string;
  currency: string;
  status: string;
  buyerId?: string;
  sellerId?: string;
  createdAt?: string;
}

function formatAmount(amount: string, currency: string) {
  return `${currency === "NGN" ? "₦" : "$"}${Number(amount).toLocaleString()}`;
}

function TrackingTimeline({ status, shipment }: { status: string; shipment?: Shipment }) {
  const isReturned = status === "RETURNED";
  const isCancelled = status === "CANCELLED";
  const isTerminal = isReturned || isCancelled || status === "DELIVERED";

  const currentIdx = TRACKING_STEPS.findIndex((s) => s.key === status);
  const activeIdx = currentIdx >= 0 ? currentIdx : -1;

  const getTimestamp = (key: string) => {
    if (!shipment) return null;
    switch (key) {
      case "PICKED_UP": return shipment.pickedUpAt;
      case "DELIVERED": return shipment.deliveredAt;
      default: return null;
    }
  };

  return (
    <div className="w-full">
      <div className="relative">
        {TRACKING_STEPS.map((step, idx) => {
          const StepIcon = step.icon;
          const isCompleted = idx < activeIdx;
          const isCurrent = idx === activeIdx && !isTerminal && !isReturned && !isCancelled;
          const isActive = isCompleted || isCurrent;
          const timestamp = getTimestamp(step.key);

          return (
            <div key={step.key} className="flex items-start gap-4 pb-8 last:pb-0 relative">
              {idx < TRACKING_STEPS.length - 1 && (
                <div className={`absolute left-[19px] top-10 w-0.5 h-full -z-0 ${idx < activeIdx ? "bg-primary" : "bg-muted"}`} />
              )}
              <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                isCompleted
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                  : isCurrent
                  ? "bg-primary/20 text-primary border-2 border-primary animate-pulse"
                  : "bg-muted text-muted-foreground"
              }`}>
                {isCompleted ? <CheckCircle className="h-5 w-5" /> : <StepIcon className="h-4 w-4" />}
              </div>
              <div className="pt-1.5 flex-1 min-w-0">
                <p className={`text-sm font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {timestamp ? new Date(timestamp).toLocaleString() : isCompleted ? "Completed" : isCurrent ? "In progress" : "Pending"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {(isReturned || isCancelled) && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isReturned ? "bg-destructive text-destructive-foreground shadow-md shadow-destructive/30" : "bg-muted text-muted-foreground"
            }`}>
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">{isReturned ? "Returned" : "Cancelled"}</p>
              <p className="text-xs text-muted-foreground">{isReturned ? "Shipment was returned to sender" : "This shipment was cancelled"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminLogisticsDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [linkedEscrow, setLinkedEscrow] = useState<LinkedEscrow | null>(null);
  const [loading, setLoading] = useState(true);
  const [extraLoading, setExtraLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [defaultTab, setDefaultTab] = useState("tracking");

  const getToken = () => sessionStorage.getItem("accessToken");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) { toast({ title: "Error", description: "Not authenticated", variant: "destructive" }); return; }

      const [shipRes, provRes] = await Promise.all([
        fetch(`/api/v1/admin/shipments/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/v1/admin/logistics-providers", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!shipRes.ok) throw new Error(`HTTP ${shipRes.status}`);
      if (provRes.ok) {
        const provData = await provRes.json();
        setProviders(provData.data ?? []);
      }
      const shipmentData = await shipRes.json();
      setShipment(shipmentData);

      if (shipmentData.escrowId) {
        setExtraLoading(true);
        fetch(`/api/v1/admin/escrow/${shipmentData.escrowId}`, { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.ok ? r.json().then(setLinkedEscrow) : null)
          .catch(() => {})
          .finally(() => setExtraLoading(false));
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAssign = async () => {
    if (!shipment || !selectedProvider) return;
    setActionLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/v1/admin/logistics/shipments/${id}/assign`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ providerId: selectedProvider }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Assignment failed");
      }
      toast({ title: "Success", description: "Logistics provider assigned" });
      setAssignOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const provider = providers.find((p) => p.id === shipment?.logisticsProviderId);

  const docFields = [
    { label: "Bill of Lading", url: shipment?.billOfLadingUrl, icon: FileText },
    { label: "SGS Certificate", url: shipment?.sgsCertificateUrl, icon: FileText },
    { label: "Shipping Manifest", url: shipment?.shippingManifestUrl, icon: FileText },
    { label: "Inspection Report", url: shipment?.inspectionReportUrl, icon: Eye },
  ].filter((d) => d.url);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="text-center py-20">
        <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
        <h2 className="text-xl font-semibold">Shipment not found</h2>
        <p className="text-muted-foreground mt-2 text-sm">This shipment may have been deleted.</p>
        <Button variant="outline" className="mt-6" onClick={() => setLocation("/admin/logistics")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Logistics
        </Button>
      </div>
    );
  }

  const statusCfg = STATUS_BADGE[shipment.status] ?? { variant: "outline" as const, label: shipment.status };

  const tabs = [
    { value: "tracking", label: "Tracking", icon: Navigation },
    { value: "escrow", label: "Escrow", icon: Wallet, disabled: !linkedEscrow },
    { value: "documents", label: "Documents", icon: FileText, disabled: docFields.length === 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setLocation("/admin/logistics")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Shipment Detail</h1>
              <Badge variant={statusCfg.variant} className="text-sm px-3 py-1">{statusCfg.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground font-mono mt-0.5">{shipment.trackingCode ?? shipment.id}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={defaultTab} onValueChange={setDefaultTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} disabled={tab.disabled} className="gap-2">
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tracking Tab */}
        <TabsContent value="tracking" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-primary" />
                  Tracking Progress
                </CardTitle>
                <CardDescription>Real-time shipment status</CardDescription>
              </CardHeader>
              <CardContent>
                <TrackingTimeline status={shipment.status} shipment={shipment} />
              </CardContent>
            </Card>

            <div className="lg:col-span-3 space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Route
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-4 h-4 rounded-full bg-primary mt-1" />
                      <div className="w-0.5 h-16 bg-gradient-to-b from-primary to-muted-foreground" />
                      <div className="w-4 h-4 rounded-full bg-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-12">
                      <div>
                        <p className="text-xs text-muted-foreground">Origin</p>
                        <p className="text-sm font-medium">{shipment.originAddress ?? "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Destination</p>
                        <p className="text-sm font-medium">{shipment.destinationAddress ?? "Not specified"}</p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground shrink-0">
                      {shipment.estimatedDeliveryAt && (
                        <div className="bg-muted px-3 py-2 rounded-lg">
                          <p className="text-xs">Est. Delivery</p>
                          <p className="font-medium text-foreground">{new Date(shipment.estimatedDeliveryAt).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {provider ? (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Building className="h-4 w-4 text-primary" />
                        Logistics Provider
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{provider.companyName}</span>
                        {provider.isVerified && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Verified</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{provider.phone}</span>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        Logistics Provider
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {shipment.status === "PENDING" ? (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">No provider assigned yet</p>
                          <Button size="sm" onClick={() => { setSelectedProvider(""); setAssignOpen(true); }}>
                            Assign Provider
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">—</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Shipment Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Escrow ID</span>
                      <span className="font-mono text-xs">{shipment.escrowId.substring(0, 12)}...</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Verification Code</span>
                      <span className="font-mono text-xs">{shipment.verificationCode || "—"}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cost</span>
                      <span className="font-medium">{shipment.costKobo ? `₦${(shipment.costKobo / 100).toLocaleString()}` : "—"}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span>{new Date(shipment.createdAt).toLocaleDateString()}</span>
                    </div>
                    {shipment.pickedUpAt && (
                      <>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Picked Up</span>
                          <span>{new Date(shipment.pickedUpAt).toLocaleDateString()}</span>
                        </div>
                      </>
                    )}
                    {shipment.deliveredAt && (
                      <>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Delivered</span>
                          <span>{new Date(shipment.deliveredAt).toLocaleDateString()}</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Escrow Tab */}
        <TabsContent value="escrow" className="mt-6 space-y-6">
          {extraLoading ? (
            <Skeleton className="h-40 w-full rounded-xl" />
          ) : linkedEscrow ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  Linked Escrow
                </CardTitle>
                <CardDescription>Escrow transaction tied to this shipment</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground text-xs">Escrow ID</dt>
                    <dd className="font-mono text-xs mt-0.5">{linkedEscrow.id}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Platform</dt>
                    <dd className="mt-0.5"><Badge variant="outline">{linkedEscrow.platform}</Badge></dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Amount</dt>
                    <dd className="font-bold text-xl mt-0.5">{formatAmount(linkedEscrow.amount, linkedEscrow.currency)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Status</dt>
                    <dd className="mt-0.5">
                      <Badge variant={
                        linkedEscrow.status === "FUNDS_RELEASED" ? "default"
                        : linkedEscrow.status === "IN_DISPUTE" ? "destructive"
                        : linkedEscrow.status === "FUNDS_HELD" ? "secondary"
                        : "outline"
                      }>
                        {linkedEscrow.status}
                      </Badge>
                    </dd>
                  </div>
                  {linkedEscrow.buyerId && (
                    <div>
                      <dt className="text-muted-foreground text-xs">Buyer ID</dt>
                      <dd className="font-mono text-xs mt-0.5">{linkedEscrow.buyerId}</dd>
                    </div>
                  )}
                  {linkedEscrow.sellerId && (
                    <div>
                      <dt className="text-muted-foreground text-xs">Seller ID</dt>
                      <dd className="font-mono text-xs mt-0.5">{linkedEscrow.sellerId}</dd>
                    </div>
                  )}
                  {linkedEscrow.createdAt && (
                    <>
                      <Separator className="sm:col-span-2" />
                      <div>
                        <dt className="text-muted-foreground text-xs">Created</dt>
                        <dd className="mt-0.5">{new Date(linkedEscrow.createdAt).toLocaleString()}</dd>
                      </div>
                    </>
                  )}
                </dl>
                <div className="mt-4">
                  <Button variant="outline" size="sm" onClick={() => setLocation(`/admin/escrow/${linkedEscrow.id}`)}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Escrow Detail
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-10 text-muted-foreground">
                <Wallet className="h-8 w-8 mx-auto mb-3 opacity-20" />
                <p>No escrow data available for this shipment.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {docFields.map((doc) => (
              <a key={doc.label} href={doc.url!} target="_blank" rel="noreferrer" className="block">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardContent className="flex items-center gap-4 pt-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <doc.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{doc.label}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">Click to view document</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {assignOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Assign Logistics Provider</CardTitle>
              <CardDescription>Select a logistics provider for this shipment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label>Provider</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.length === 0 && <SelectItem value=" " disabled>No providers available</SelectItem>}
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.companyName} {p.isVerified ? "✓" : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
                <Button onClick={handleAssign} disabled={actionLoading || !selectedProvider}>
                  {actionLoading ? "Assigning..." : "Assign"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
