import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { customFetch } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Search, User, Phone, Mail, ShieldCheck, Ban, Calendar, Package, ArrowLeftRight } from "lucide-react";

export default function SupportUserLookup() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await customFetch<any>(`/api/v1/admin/users?search=${encodeURIComponent(query)}&limit=1`);
      const found = res.data?.[0];
      if (found) {
        setUser(found);
        customFetch<any>(`/api/v1/admin/orders?limit=10`).then((o) => setOrders(o.data ?? [])).catch(() => null);
      } else {
        setUser(null);
        setOrders([]);
        toast({ title: "User not found", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Search failed", description: err?.data?.error ?? err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">User Lookup</h2>
        <p className="text-muted-foreground mt-1">Search for users and view their profile, orders, and activity.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" /> Search User</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by phone, email, or user ID..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading || !query.trim()}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card><CardContent className="p-6"><Skeleton className="h-32 w-full rounded" /></CardContent></Card>
      )}

      {searched && !loading && !user && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium">No user found</p>
            <p className="text-sm">Try a different phone number, email, or user ID.</p>
          </CardContent>
        </Card>
      )}

      {user && (
        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> User Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono">{user.phone}</span>
                    </div>
                    {user.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{user.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {user.isActive ? (
                        <span className="flex items-center gap-1 text-sm text-green-600"><ShieldCheck className="h-4 w-4" /> Active</span>
                      ) : (
                        <span className="flex items-center gap-1 text-sm text-red-600"><Ban className="h-4 w-4" /> Suspended</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.kycStatus === "APPROVED" ? "default" : user.kycStatus === "PENDING" ? "secondary" : "outline"}>
                        KYC: {user.kycStatus ?? "N/A"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                {user.profile && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium mb-2">Profile</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {user.profile.firstName && <div><span className="text-muted-foreground">Name:</span> {user.profile.firstName} {user.profile.lastName}</div>}
                      {user.profile.businessName && <div><span className="text-muted-foreground">Business:</span> {user.profile.businessName}</div>}
                      {user.profile.state && <div><span className="text-muted-foreground">State:</span> {user.profile.state}</div>}
                      {user.profile.country && <div><span className="text-muted-foreground">Country:</span> {user.profile.country}</div>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No orders found.</div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((o: any) => (
                      <div key={o.id} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                        <div>
                          <span className="font-mono text-xs">{o.id?.substring(0, 8)}...</span>
                          <span className="mx-2 text-muted-foreground">•</span>
                          <Badge variant="outline">{o.status}</Badge>
                        </div>
                        <span className="font-medium">{o.currency || "NGN"} {o.total?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ArrowLeftRight className="h-5 w-5" /> Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">Activity log coming soon.</div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
