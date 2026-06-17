import { useState } from "react";
import { useGetMe, useUpdateMe, useUpdatePin } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Mail, Phone, MapPin, Building, ShieldCheck, Settings, Lock, KeyRound, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ha", label: "Hausa" },
  { value: "ig", label: "Igbo" },
  { value: "yo", label: "Yoruba" },
];

export default function Profile() {
  const { data: user, isLoading, refetch } = useGetMe();
  const { toast } = useToast();

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editBusinessName, setEditBusinessName] = useState("");
  const [editState, setEditState] = useState("");

  const updateMeMutation = useUpdateMe();

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [showUpdatePin, setShowUpdatePin] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const updatePinMutation = useUpdatePin();

  const [showLanguage, setShowLanguage] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const openEditProfile = () => {
    if (!user) return;
    setEditFirstName(user.firstName ?? "");
    setEditLastName(user.lastName ?? "");
    setEditEmail(user.email ?? "");
    setEditBusinessName(user.businessName ?? "");
    setEditState(user.state ?? "");
    setShowEditProfile(true);
  };

  const handleEditProfile = async () => {
    try {
      await updateMeMutation.mutateAsync({
        data: {
          firstName: editFirstName || undefined,
          lastName: editLastName || undefined,
          email: editEmail || undefined,
          businessName: editBusinessName || undefined,
          state: editState || undefined,
        },
      });
      toast({ title: "Success", description: "Profile updated successfully" });
      setShowEditProfile(false);
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.error ?? err.message, variant: "destructive" });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    try {
      const token = sessionStorage.getItem("accessToken");
      const res = await fetch("/api/v1/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast({ title: "Success", description: json.message });
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleUpdatePin = async () => {
    if (newPin !== confirmPin) {
      toast({ title: "Error", description: "PINs do not match", variant: "destructive" });
      return;
    }
    if (!/^\d{4,6}$/.test(newPin)) {
      toast({ title: "Error", description: "PIN must be 4–6 digits", variant: "destructive" });
      return;
    }
    try {
      await updatePinMutation.mutateAsync({
        data: {
          currentPin: currentPin || undefined,
          pin: newPin,
        },
      });
      toast({ title: "Success", description: "Transaction PIN updated" });
      setShowUpdatePin(false);
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.error ?? err.message, variant: "destructive" });
    }
  };

  const handleChangeLanguage = async () => {
    try {
      await updateMeMutation.mutateAsync({
        data: { language: selectedLanguage as any },
      });
      toast({ title: "Success", description: "Language updated" });
      setShowLanguage(false);
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.error ?? err.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!user) return null;

  const isAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN_MODERATOR";

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account details and preferences.</p>
      </div>

      <Card className="border-t-4 border-t-primary overflow-hidden">
        <div className="h-32 bg-muted/50 w-full"></div>
        <CardContent className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 sm:-mt-12 mb-6">
            <Avatar className="h-32 w-32 border-4 border-background shadow-sm">
              <AvatarImage src={user.avatarUrl || ""} alt={user.firstName || "User"} />
              <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                {(user.firstName?.[0] || "") + (user.lastName?.[0] || "")}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left flex-1 pb-2">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2>
                {isAdmin && <Shield className="h-5 w-5 text-amber-500" />}
              </div>
              <p className="text-muted-foreground mt-1">{user.role}</p>
            </div>
            <div className="pb-2">
              <Button variant="outline" className="gap-2" onClick={openEditProfile}>
                <Settings className="h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-border">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                Personal Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-md bg-muted/30">
                  <span className="text-sm text-muted-foreground">Full Name</span>
                  <span className="font-medium">{user.firstName} {user.lastName}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-md bg-muted/30">
                  <span className="text-sm text-muted-foreground flex items-center gap-2"><Phone className="h-4 w-4" /> Phone</span>
                  <span className="font-medium">{user.phone}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-md bg-muted/30">
                  <span className="text-sm text-muted-foreground flex items-center gap-2"><Mail className="h-4 w-4" /> Email</span>
                  <span className="font-medium">{user.email || "Not provided"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Building className="h-5 w-5 text-muted-foreground" />
                Details
              </h3>
              <div className="space-y-3">
                {!isAdmin && (
                  <div className="flex justify-between items-center p-3 rounded-md bg-muted/30">
                    <span className="text-sm text-muted-foreground">Business Name</span>
                    <span className="font-medium">{user.businessName || "Not provided"}</span>
                  </div>
                )}
                <div className="flex justify-between items-center p-3 rounded-md bg-muted/30">
                  <span className="text-sm text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4" /> Location</span>
                  <span className="font-medium">{user.state ? `${user.state}, ${user.country}` : "Not provided"}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-md bg-muted/30">
                  <span className="text-sm text-muted-foreground flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> KYC Status</span>
                  <Badge variant={user.kycStatus === "APPROVED" ? "default" : "secondary"}>
                    {user.kycStatus}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Security Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Transaction PIN</p>
                <p className="text-sm text-muted-foreground">Required for escrow and payments</p>
              </div>
              <Button variant="outline" onClick={() => { setCurrentPin(""); setNewPin(""); setConfirmPin(""); setShowUpdatePin(true); }}>
                <KeyRound className="h-4 w-4 mr-2" />
                Update PIN
              </Button>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-muted-foreground">Change your account password</p>
              </div>
              <Button variant="outline" onClick={() => setShowChangePassword(true)}>
                <Lock className="h-4 w-4 mr-2" />
                Change
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Platform Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Language</p>
                <p className="text-sm text-muted-foreground">
                  Current: {LANGUAGES.find((l) => l.value === user.language)?.label ?? user.language}
                </p>
              </div>
              <Button variant="outline" onClick={() => { setSelectedLanguage(user.language ?? "en"); setShowLanguage(true); }}>
                Change
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your personal information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFirstName">First Name</Label>
                <Input id="editFirstName" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastName">Last Name</Label>
                <Input id="editLastName" value={editLastName} onChange={(e) => setEditLastName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email</Label>
              <Input id="editEmail" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="your@email.com" />
            </div>
            {!isAdmin && (
              <div className="space-y-2">
                <Label htmlFor="editBusinessName">Business Name</Label>
                <Input id="editBusinessName" value={editBusinessName} onChange={(e) => setEditBusinessName(e.target.value)} />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="editState">State / Region</Label>
              <Input id="editState" value={editState} onChange={(e) => setEditState(e.target.value)} placeholder="e.g. Lagos" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditProfile(false)}>Cancel</Button>
            <Button onClick={handleEditProfile} disabled={updateMeMutation.isPending}>
              {updateMeMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter your current password and a new password.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <p className="text-xs text-muted-foreground">Min 8 chars, uppercase, lowercase, digit, special char</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangePassword(false)}>Cancel</Button>
            <Button onClick={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? "Changing..." : "Change Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUpdatePin} onOpenChange={setShowUpdatePin}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Transaction PIN</DialogTitle>
            <DialogDescription>Set or change your 4–6 digit transaction PIN.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPin">Current PIN</Label>
              <Input id="currentPin" type="password" value={currentPin} onChange={(e) => setCurrentPin(e.target.value)} placeholder="Leave blank if setting for first time" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPin">New PIN</Label>
              <Input id="newPin" type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="4–6 digits" maxLength={6} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPin">Confirm New PIN</Label>
              <Input id="confirmPin" type="password" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} placeholder="Re-enter new PIN" maxLength={6} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdatePin(false)}>Cancel</Button>
            <Button onClick={handleUpdatePin} disabled={updatePinMutation.isPending}>
              {updatePinMutation.isPending ? "Updating..." : "Update PIN"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLanguage} onOpenChange={setShowLanguage}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Language</DialogTitle>
            <DialogDescription>Select your preferred platform language.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLanguage(false)}>Cancel</Button>
            <Button onClick={handleChangeLanguage} disabled={updateMeMutation.isPending}>
              {updateMeMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
