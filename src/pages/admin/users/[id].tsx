import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Save,
  Edit,
  Package,
  ShoppingCart,
  Wallet,
  ScrollText,
  Eye,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { customFetch } from "@workspace/api-client-react";

const USER_ROLES = [
  "FARMER",
  "TRADER",
  "EXPORTER",
  "IMPORTER",
  "CONSUMER",
  "LOGISTICS_PROVIDER",
  "ADMIN",
];

const KYC_STATUSES = ["APPROVED", "REJECTED", "PENDING", "PENDING_SUBMISSION"];

interface UserDetail {
  id: string;
  phone: string;
  email: string | null;
  role: string;
  language: string;
  isActive: boolean;
  kycStatus: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  firstName: string | null;
  lastName: string | null;
  businessName: string | null;
  bio: string | null;
  state: string | null;
  country: string | null;
  avatarUrl: string | null;
}

interface SeedListing {
  id: string;
  title: string;
  price: string;
  quantity: number;
  unit: string;
  category: string;
  status: string;
  image_urls: string[];
  created_at: string;
}

interface BartarListing {
  id: string;
  commodity_name: string;
  quantity: number;
  unit: string;
  status: string;
  created_at: string;
}

interface Escrow {
  id: string;
  platform: string;
  amount: string;
  currency: string;
  status: string;
  listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  buyer_phone?: string;
  seller_phone?: string;
}

interface LogEntry {
  id: string;
  action: string;
  entityType: string;
  result: string;
  notes: string | null;
  createdAt: string;
  adminName: string;
}

interface WalletDetail {
  id: string;
  user_id: string;
  balance: number;
  pending_balance: number;
  total_deposited: number;
  total_withdrawn: number;
  currency: string;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const token = sessionStorage.getItem("accessToken");
    if (!token) return null;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function formatAmount(amount: string | number, currency: string) {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return `${currency === "NGN" ? "₦" : "$"}${n.toLocaleString()}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const LISTING_STATUS_BADGE: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  ACTIVE: { variant: "default", label: "Active" },
  SOLD: { variant: "secondary", label: "Sold" },
  SUSPENDED: { variant: "destructive", label: "Suspended" },
  EXPIRED: { variant: "outline", label: "Expired" },
};

const ESCROW_STATUS_BADGE: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  AWAITING_DEPOSIT: { variant: "outline", label: "Awaiting Deposit" },
  FUNDS_HELD: { variant: "secondary", label: "Funds Held" },
  FUNDS_RELEASED: { variant: "default", label: "Released" },
  IN_DISPUTE: { variant: "destructive", label: "In Dispute" },
  REFUNDED: { variant: "outline", label: "Refunded" },
  CANCELLED: { variant: "outline", label: "Cancelled" },
};

export default function UserDetailPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<UserDetail>>({});

  const [seedListings, setSeedListings] = useState<SeedListing[]>([]);
  const [bartarListings, setBartarListings] = useState<BartarListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);

  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [escrowsLoading, setEscrowsLoading] = useState(false);

  const [wallet, setWallet] = useState<WalletDetail | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["admin-user", id],
    queryFn: async () => {
      const res = await customFetch<UserDetail>(`/api/v1/admin/users/${id}`);
      return res;
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: Partial<UserDetail>) => {
      return customFetch(`/api/v1/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", id] });
      toast({ title: "User updated", description: "User information has been updated" });
      setIsEditing(false);
    },
    onError: (err: any) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    updateUserMutation.mutate(editData);
  };

  const fetchListings = useCallback(async () => {
    setListingsLoading(true);
    const [seedRes, bartarRes] = await Promise.all([
      fetchJson<{ data: SeedListing[] }>(`/api/v1/admin/listings/seed?sellerId=${id}&limit=50`),
      fetchJson<{ data: BartarListing[] }>(`/api/v1/admin/listings/bartar?sellerId=${id}&limit=50`),
    ]);
    if (seedRes) setSeedListings(seedRes.data);
    if (bartarRes) setBartarListings(bartarRes.data);
    setListingsLoading(false);
  }, [id]);

  const fetchEscrows = useCallback(async () => {
    setEscrowsLoading(true);
    const [asBuyer, asSeller] = await Promise.all([
      fetchJson<{ data: Escrow[] }>(`/api/v1/admin/escrow?buyerId=${id}&limit=50`),
      fetchJson<{ data: Escrow[] }>(`/api/v1/admin/escrow?sellerId=${id}&limit=50`),
    ]);
    const merged: Escrow[] = [];
    const seen = new Set<string>();
    for (const e of [...(asBuyer?.data ?? []), ...(asSeller?.data ?? [])]) {
      if (!seen.has(e.id)) { seen.add(e.id); merged.push(e); }
    }
    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setEscrows(merged);
    setEscrowsLoading(false);
  }, [id]);

  const fetchWallet = useCallback(async () => {
    setWalletLoading(true);
    const res = await fetchJson<WalletDetail>(`/api/v1/admin/wallets/users/${id}`);
    if (res) setWallet(res);
    setWalletLoading(false);
  }, [id]);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    const res = await fetchJson<{ data: LogEntry[] }>(`/api/v1/admin/logs?entityType=user&entityId=${id}&limit=50`);
    if (res) setLogs(res.data);
    setLogsLoading(false);
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchListings();
      fetchEscrows();
      fetchWallet();
      fetchLogs();
    }
  }, [id, fetchListings, fetchEscrows, fetchWallet, fetchLogs]);

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <div className="text-center py-12">User not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => setLocation("/admin/users")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {user.firstName || user.lastName
              ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
              : "User"}
          </h1>
          <p className="text-muted-foreground">{user.phone}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user.avatarUrl && (
              <div className="flex justify-center mb-4">
                <img
                  src={user.avatarUrl}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border-2 border-border"
                />
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge variant={user.isActive ? "secondary" : "destructive"}>
                  {user.isActive ? "Active" : "Suspended"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Role</span>
                <Badge variant="outline">{user.role}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">KYC Status</span>
                <Badge
                  variant={
                    user.kycStatus === "APPROVED"
                      ? "default"
                      : user.kycStatus === "REJECTED"
                      ? "destructive"
                      : "outline"
                  }
                >
                  {user.kycStatus}
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {user.phone}
              </div>
              {user.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {user.email}
                </div>
              )}
              {user.businessName && (
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  {user.businessName}
                </div>
              )}
              {user.state && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {user.state}, {user.country || "Nigeria"}
                </div>
              )}
            </div>

            {/* Wallet summary */}
            <div className="pt-4 border-t">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Wallet</h4>
              {walletLoading ? (
                <Skeleton className="h-12 w-full rounded" />
              ) : wallet ? (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Balance</span>
                    <span className="font-semibold">{formatAmount(wallet.balance, wallet.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pending</span>
                    <span>{formatAmount(wallet.pending_balance, wallet.currency)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No wallet found</p>
              )}
            </div>

            <div className="pt-4 border-t space-y-1 text-xs text-muted-foreground">
              <p>Joined: {formatDate(user.createdAt)}</p>
              {user.lastLoginAt && (
                <p>Last login: {formatDateTime(user.lastLoginAt)}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Profile Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Manage user details</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input
                        value={editData.firstName ?? user.firstName ?? ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            firstName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input
                        value={editData.lastName ?? user.lastName ?? ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            lastName: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={editData.phone ?? user.phone}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={editData.email ?? user.email ?? ""}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select
                        value={editData.role ?? user.role}
                        onValueChange={(v) => setEditData({ ...editData, role: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {USER_ROLES.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role.charAt(0) + role.slice(1).toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>KYC Status</Label>
                      <Select
                        value={editData.kycStatus ?? user.kycStatus}
                        onValueChange={(v) => setEditData({ ...editData, kycStatus: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {KYC_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Business Name</Label>
                      <Input
                        value={editData.businessName ?? user.businessName ?? ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            businessName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input
                        value={editData.state ?? user.state ?? ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            state: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Avatar URL</Label>
                    <div className="flex gap-2">
                      <Input
                        className="flex-1"
                        value={editData.avatarUrl ?? user.avatarUrl ?? ""}
                        onChange={(e) => setEditData({ ...editData, avatarUrl: e.target.value })}
                        placeholder="https://example.com/avatar.jpg"
                      />
                      {editData.avatarUrl && (
                        <div className="w-10 h-10 rounded-full overflow-hidden border shrink-0">
                          <img src={editData.avatarUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={updateUserMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {updateUserMutation.isPending ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">First Name:</span>
                    <p className="font-medium">{user.firstName || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Name:</span>
                    <p className="font-medium">{user.lastName || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <p className="font-medium">{user.phone}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{user.email || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Business Name:</span>
                    <p className="font-medium">{user.businessName || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">State:</span>
                    <p className="font-medium">{user.state || "—"}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground">Bio:</span>
                    <p className="font-medium">{user.bio || "—"}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs for Listings, Orders, Escrows, Wallet, Activity */}
          <Tabs defaultValue="listings">
            <TabsList className="flex-wrap">
              <TabsTrigger value="listings" className="flex items-center gap-1">
                <Package className="h-4 w-4" /> Listings
              </TabsTrigger>
              <TabsTrigger value="escrows" className="flex items-center gap-1">
                <Shield className="h-4 w-4" /> Escrows
              </TabsTrigger>
              <TabsTrigger value="wallet" className="flex items-center gap-1">
                <Wallet className="h-4 w-4" /> Wallet
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-1">
                <ScrollText className="h-4 w-4" /> Activity
              </TabsTrigger>
            </TabsList>

            {/* Listings Tab */}
            <TabsContent value="listings" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Listings</CardTitle>
                    <CardDescription>Seed and bartar listings created by this user</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchListings} disabled={listingsLoading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${listingsLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </CardHeader>
                <CardContent>
                  {listingsLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded" />)}
                    </div>
                  ) : seedListings.length === 0 && bartarListings.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Package className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p>No listings found for this user.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {bartarListings.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Bartar Listings ({bartarListings.length})</h4>
                          <div className="rounded-lg border border-border overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/30">
                                  <TableHead>Commodity</TableHead>
                                  <TableHead>Qty</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Created</TableHead>
                                  <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {bartarListings.map((l) => (
                                  <TableRow key={l.id}>
                                    <TableCell className="font-medium">{l.commodity_name}</TableCell>
                                    <TableCell>{l.quantity} {l.unit}</TableCell>
                                    <TableCell>
                                      <Badge variant={l.status === "ACTIVE" ? "default" : l.status === "SOLD" ? "secondary" : "outline"} className="text-xs">
                                        {l.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{formatDate(l.created_at)}</TableCell>
                                    <TableCell className="text-right">
                                      <Button variant="ghost" size="sm" onClick={() => setLocation(`/admin/bartar-listings/${l.id}`)}>
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                      {seedListings.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Seed Listings ({seedListings.length})</h4>
                          <div className="rounded-lg border border-border overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/30">
                                  <TableHead>Title</TableHead>
                                  <TableHead>Price</TableHead>
                                  <TableHead>Qty</TableHead>
                                  <TableHead>Category</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {seedListings.map((l) => (
                                  <TableRow key={l.id}>
                                    <TableCell className="font-medium">{l.title}</TableCell>
                                    <TableCell>{formatAmount(l.price, "NGN")}</TableCell>
                                    <TableCell>{l.quantity} {l.unit}</TableCell>
                                    <TableCell className="text-xs">{l.category}</TableCell>
                                    <TableCell>
                                      <Badge variant={LISTING_STATUS_BADGE[l.status]?.variant ?? "outline"} className="text-xs">
                                        {LISTING_STATUS_BADGE[l.status]?.label ?? l.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button variant="ghost" size="sm" onClick={() => setLocation(`/admin/seed-listings/${l.id}`)}>
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Escrows Tab */}
            <TabsContent value="escrows" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Escrows</CardTitle>
                    <CardDescription>Escrow transactions where this user is buyer or seller</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchEscrows} disabled={escrowsLoading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${escrowsLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </CardHeader>
                <CardContent>
                  {escrowsLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded" />)}
                    </div>
                  ) : escrows.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Shield className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p>No escrow transactions found for this user.</p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead>Platform</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {escrows.map((e) => (
                            <TableRow key={e.id}>
                              <TableCell><Badge variant="outline" className="text-xs">{e.platform}</Badge></TableCell>
                              <TableCell>
                                <Badge variant={e.buyer_id === id ? "secondary" : "outline"} className="text-xs">
                                  {e.buyer_id === id ? "Buyer" : "Seller"}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">{formatAmount(e.amount, e.currency)}</TableCell>
                              <TableCell>
                                <Badge variant={ESCROW_STATUS_BADGE[e.status]?.variant ?? "outline"} className="text-xs">
                                  {ESCROW_STATUS_BADGE[e.status]?.label ?? e.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{formatDate(e.created_at)}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" onClick={() => setLocation(`/admin/escrow/${e.id}`)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Wallet Tab */}
            <TabsContent value="wallet" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Wallet</CardTitle>
                    <CardDescription>User wallet balance and transaction summary</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchWallet} disabled={walletLoading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${walletLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </CardHeader>
                <CardContent>
                  {walletLoading ? (
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded" />)}
                    </div>
                  ) : !wallet ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Wallet className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p>No wallet found for this user.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">{formatAmount(wallet.balance, wallet.currency)}</div>
                          <p className="text-sm text-muted-foreground">Available Balance</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-muted-foreground">{formatAmount(wallet.pending_balance, wallet.currency)}</div>
                          <p className="text-sm text-muted-foreground">Pending Balance</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-lg font-semibold text-green-600">{formatAmount(wallet.total_deposited, wallet.currency)}</div>
                          <p className="text-sm text-muted-foreground">Total Deposited</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-lg font-semibold text-orange-600">{formatAmount(wallet.total_withdrawn, wallet.currency)}</div>
                          <p className="text-sm text-muted-foreground">Total Withdrawn</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Activity Log</CardTitle>
                    <CardDescription>Admin actions related to this user</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchLogs} disabled={logsLoading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${logsLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </CardHeader>
                <CardContent>
                  {logsLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded" />)}
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ScrollText className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p>No activity logs found for this user.</p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead>Action</TableHead>
                            <TableHead>Admin</TableHead>
                            <TableHead>Result</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {logs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell>
                                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{log.action}</code>
                              </TableCell>
                              <TableCell className="text-sm">{log.adminName}</TableCell>
                              <TableCell>
                                <Badge variant={log.result === "SUCCESS" ? "default" : "destructive"} className="text-xs">
                                  {log.result}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{log.notes || "—"}</TableCell>
                              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDateTime(log.createdAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
