import { useState } from "react";
import {
  useAdminListUsers,
  getAdminListUsersQueryKey,
  customFetch,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Search,
  Shield,
  ChevronLeft,
  ChevronRight,
  UserCog,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";


const ROLES = [
  "FARMER",
  "CONSUMER",
  "TRADER",
  "EXPORTER",
  "IMPORTER",
  "LOGISTICS_PROVIDER",
  "AGRI_SUPPLIER",
  "COOPERATIVE_MANAGER",
  "ADMIN_MODERATOR",
  "SUPER_ADMIN",
];

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-destructive/10 text-destructive border-destructive/20",
  ADMIN_MODERATOR: "bg-destructive/5 text-destructive/80 border-destructive/10",
  FARMER: "bg-primary/10 text-primary border-primary/20",
  CONSUMER: "bg-muted text-muted-foreground border-border",
  TRADER: "bg-secondary/10 text-secondary border-secondary/20",
  EXPORTER: "bg-secondary/15 text-secondary border-secondary/25",
  IMPORTER: "bg-muted text-muted-foreground border-border",
  LOGISTICS_PROVIDER: "bg-accent/10 text-accent-foreground border-accent/20",
  AGRI_SUPPLIER: "bg-accent/5 text-accent-foreground border-accent/10",
  COOPERATIVE_MANAGER: "bg-primary/5 text-primary border-primary/10",
};

export default function AdminRoles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [targetUser, setTargetUser] = useState<any>(null);
  const [newRole, setNewRole] = useState("");

  const params = {
    page,
    limit: 20,
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(roleFilter !== "ALL" ? { role: roleFilter } : {}),
  };

  const { data, isLoading } = useAdminListUsers(params, {
    query: { queryKey: getAdminListUsersQueryKey(params) },
  });

  const [isUpdating, setIsUpdating] = useState(false);

  const users = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1;

  const openRoleChange = (user: any) => {
    setTargetUser(user);
    setNewRole(user.role);
  };

  const handleRoleChange = async () => {
    if (!targetUser || !newRole || newRole === targetUser.role) return;

    setIsUpdating(true);
    try {
      await customFetch(`/api/v1/admin/users/${targetUser.id}`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      toast({
        title: "Role updated",
        description: `${targetUser.firstName ?? targetUser.phone} role changed to ${newRole}.`,
      });
      setTargetUser(null);
      queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey(params) });
    } catch (err: any) {
      toast({ title: "Update failed", description: err?.data?.error ?? err.message, variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role & Permissions Management
          </CardTitle>
          <CardDescription>
            View and change user roles. Role changes take effect immediately.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name, phone or email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All roles</SelectItem>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded" />)}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>No users match this filter.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>User</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {[user.firstName, user.lastName].filter(Boolean).join(" ") || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">{user.phone}</p>
                          {user.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${ROLE_COLORS[user.role] ?? "bg-muted text-muted-foreground"}`}>
                          {user.role?.replace(/_/g, " ")}
                        </span>
                      </TableCell>
                      <TableCell>
                        {user.isActive
                          ? <Badge variant="secondary" className="text-xs">Active</Badge>
                          : <Badge variant="destructive" className="text-xs">Suspended</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openRoleChange(user)}
                          disabled={user.role === "SUPER_ADMIN"}
                        >
                          <UserCog className="h-4 w-4 mr-1" />
                          Change Role
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {meta && totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {meta.total} user{meta.total !== 1 ? "s" : ""} — page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!targetUser} onOpenChange={(open) => { if (!open) { setTargetUser(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Change User Role
            </DialogTitle>
            <DialogDescription>
              Update role for {targetUser?.firstName ?? targetUser?.phone}. This affects their platform permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Current role: <span className="font-medium text-foreground">{targetUser?.role}</span>
            </p>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select new role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTargetUser(null)}>Cancel</Button>
            <Button onClick={handleRoleChange} disabled={isUpdating || newRole === targetUser?.role}>
              {isUpdating ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
