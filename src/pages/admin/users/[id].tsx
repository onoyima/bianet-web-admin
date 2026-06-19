import { useState } from "react";
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

export default function UserDetailPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<UserDetail>>({});

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

            <div className="pt-4 border-t space-y-1 text-xs text-muted-foreground">
              <p>Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
              {user.lastLoginAt && (
                <p>Last login: {new Date(user.lastLoginAt).toLocaleString()}</p>
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

          {/* Tabs for Listings, Orders, Activity */}
          <Tabs defaultValue="listings">
            <TabsList>
              <TabsTrigger value="listings">Listings</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="listings" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12 text-muted-foreground">
                    Listings will be shown here
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="orders" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12 text-muted-foreground">
                    Orders will be shown here
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12 text-muted-foreground">
                    Activity logs will be shown here
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
