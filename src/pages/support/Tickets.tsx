import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { customFetch } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function SupportTickets() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPriority, setFormPriority] = useState("MEDIUM");
  const [creating, setCreating] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await customFetch<any>(`/api/v1/admin/notifications?${params}`);
      setTickets(res.data ?? []);
    } catch (err: any) {
      toast({ title: "Failed to load", description: err?.data?.error ?? err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, [page, statusFilter]);

  const handleCreate = async () => {
    if (!formTitle.trim()) return;
    setCreating(true);
    try {
      await customFetch("/api/v1/admin/notifications/broadcast", {
        method: "POST",
        body: JSON.stringify({ title: formTitle, message: formDescription, type: "SUPPORT_TICKET", priority: formPriority }),
      });
      toast({ title: "Ticket created" });
      setCreateOpen(false);
      setFormTitle("");
      setFormDescription("");
      setFormPriority("MEDIUM");
      fetchTickets();
    } catch (err: any) {
      toast({ title: "Failed to create", description: err?.data?.error ?? err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Ticket Management</h2>
          <p className="text-muted-foreground mt-1">View, assign, and respond to support tickets.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Ticket</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
              <DialogDescription>Broadcast a notification or create a support ticket.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="ticket-title">Title</Label>
                <Input id="ticket-title" placeholder="Issue summary..." value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket-desc">Description</Label>
                <Textarea id="ticket-desc" placeholder="Detailed description..." value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={formPriority} onValueChange={setFormPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!formTitle.trim() || creating}>{creating ? "Creating..." : "Create Ticket"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Tickets</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9 w-48" placeholder="Search tickets..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && fetchTickets()} />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded" />)}</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>No tickets found.</p></div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell><Badge variant="outline">{t.type ?? "GENERAL"}</Badge></TableCell>
                      <TableCell className="max-w-xs truncate">{t.message ?? t.title ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{t.userId?.substring(0, 8)}...</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
