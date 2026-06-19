import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { customFetch } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Users as UsersIcon, Search, ChevronLeft, ChevronRight, ShieldAlert, ShieldCheck, Ban, CheckCircle2 } from "lucide-react";

export default function OpsUsers() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [users, setUsers] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      if (statusFilter !== "ALL") params.set("isActive", String(statusFilter === "ACTIVE"));
      const res = await customFetch<any>(`/api/v1/admin/users?${params}`);
      setUsers(res.data ?? []);
      setMeta(res.meta);
    } catch (err: any) {
      toast({ title: "Failed to load users", description: err?.data?.error ?? err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId: string, action: "suspend" | "activate" | "verify") => {
    try {
      await customFetch(`/api/v1/admin/users/${userId}/${action}`, { method: "POST" });
      toast({ title: `User ${action}ed successfully` });
      fetchUsers();
    } catch (err: any) {
      toast({ title: `Failed to ${action} user`, description: err?.data?.error ?? err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">User Management</h2>
        <p className="text-muted-foreground mt-1">View, search, and manage platform users.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            All Users
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && fetchUsers()} />
            </div>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Roles" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="VENDOR">Vendor</SelectItem>
                <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchUsers}>Search</Button>
          </div>

          {loading ? (
            <div className="space-y-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded" />)}</div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><UsersIcon className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>No users found.</p></div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>User</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>KYC</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.profile?.firstName ?? u.email ?? u.phone}</TableCell>
                      <TableCell className="font-mono text-xs">{u.phone}</TableCell>
                      <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                      <TableCell>
                        {u.isActive ? (
                          <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="h-3 w-3" /> Active</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-red-600"><Ban className="h-3 w-3" /> Suspended</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.kycStatus === "APPROVED" ? "default" : u.kycStatus === "PENDING" ? "secondary" : "outline"} className="text-xs">
                          {u.kycStatus ?? "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {u.isActive ? (
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleAction(u.id, "suspend")}><Ban className="h-4 w-4" /></Button>
                          ) : (
                            <Button variant="ghost" size="sm" className="text-green-600" onClick={() => handleAction(u.id, "activate")}><ShieldCheck className="h-4 w-4" /></Button>
                          )}
                          {u.kycStatus === "PENDING" && (
                            <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => handleAction(u.id, "verify")}><ShieldAlert className="h-4 w-4" /></Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {meta && Math.ceil(meta.total / meta.limit) > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">{meta.total} users — page {page} of {Math.ceil(meta.total / meta.limit)}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" disabled={page >= Math.ceil(meta.total / meta.limit)} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
