import { useState, useEffect } from "react";
import { customFetch } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  Send,
  Check,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const NOTIFICATION_TYPES = [
  "SYSTEM",
  "ORDER_PLACED",
  "PAYMENT_RECEIVED",
  "ESCROW_FUNDED",
  "ESCROW_RELEASED",
  "ESCROW_DISPUTED",
  "SHIPMENT_UPDATE",
  "KYC_APPROVED",
  "KYC_REJECTED",
  "NEW_MESSAGE",
  "CONTRACT_SIGNED",
];

const TYPE_BADGE: Record<string, string> = {
  SYSTEM: "outline",
  ORDER_PLACED: "secondary",
  PAYMENT_RECEIVED: "default",
  ESCROW_FUNDED: "default",
  ESCROW_RELEASED: "default",
  ESCROW_DISPUTED: "destructive",
  SHIPMENT_UPDATE: "secondary",
  KYC_APPROVED: "default",
  KYC_REJECTED: "destructive",
  NEW_MESSAGE: "secondary",
  CONTRACT_SIGNED: "default",
};

export default function AdminNotifications() {
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [readFilter, setReadFilter] = useState("ALL");
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastType, setBroadcastType] = useState("SYSTEM");
  const [sending, setSending] = useState(false);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (readFilter !== "ALL") params.set("isRead", readFilter === "read" ? "true" : "false");
      const res = await customFetch(`/api/v1/admin/notifications?${params}`);
      setData(res);
    } catch (err: any) {
      toast({ title: "Failed to load notifications", description: err?.data?.error ?? err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, [page, typeFilter, readFilter]);

  const notifications = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1;

  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) {
      toast({ title: "Required fields", description: "Title and body are required.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      await customFetch("/api/v1/admin/notifications/broadcast", {
        method: "POST",
        body: JSON.stringify({ title: broadcastTitle, body_text: broadcastBody, type: broadcastType }),
      });
      toast({ title: "Broadcast sent", description: "Notification sent to all active users." });
      setBroadcastOpen(false);
      setBroadcastTitle("");
      setBroadcastBody("");
      setBroadcastType("SYSTEM");
      fetchNotifications();
    } catch (err: any) {
      toast({ title: "Broadcast failed", description: err?.data?.error ?? err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const filtered = search.trim()
    ? notifications.filter(
        (n: any) =>
          n.title?.toLowerCase().includes(search.toLowerCase()) ||
          n.body?.toLowerCase().includes(search.toLowerCase()) ||
          n.type?.toLowerCase().includes(search.toLowerCase()) ||
          n.user?.phone?.includes(search) ||
          n.profile?.firstName?.toLowerCase().includes(search.toLowerCase()),
      )
    : notifications;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Management
            </CardTitle>
            <Button onClick={() => setBroadcastOpen(true)} className="gap-2">
              <Send className="h-4 w-4" />
              Broadcast
            </Button>
          </div>
          <CardDescription>
            View all platform notifications and send broadcast messages to active users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by title, body, user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All types</SelectItem>
                {NOTIFICATION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={readFilter} onValueChange={(v) => { setReadFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>{search ? "No notifications match this search." : "No notifications recorded yet."}</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>User</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((n: any) => (
                    <TableRow key={n.id} className="text-sm">
                      <TableCell>
                        <div>
                          <p className="font-medium text-xs">
                            {n.profile ? `${n.profile.firstName} ${n.profile.lastName}` : "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">{n.user?.phone ?? n.userId?.substring(0, 8)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-xs">{n.title}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{n.body}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={(TYPE_BADGE[n.type] ?? "outline") as any} className="text-xs">
                          {n.type?.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {n.isRead ? (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Check className="h-3 w-3" />
                            Read
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-primary font-medium">
                            <Bell className="h-3 w-3" />
                            Unread
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(n.createdAt).toLocaleString()}
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
                {meta.total} notification{meta.total !== 1 ? "s" : ""} — page {page} of {totalPages}
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

      <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Broadcast Notification
            </DialogTitle>
            <DialogDescription>
              Send a notification to all active platform users. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="broadcast-title">Title</Label>
              <Input
                id="broadcast-title"
                placeholder="e.g. Platform Maintenance"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="broadcast-type">Type</Label>
              <Select value={broadcastType} onValueChange={setBroadcastType}>
                <SelectTrigger id="broadcast-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="broadcast-body">Body</Label>
              <Textarea
                id="broadcast-body"
                placeholder="Enter notification message..."
                rows={4}
                value={broadcastBody}
                onChange={(e) => setBroadcastBody(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBroadcastOpen(false)}>Cancel</Button>
            <Button onClick={handleBroadcast} disabled={sending}>
              {sending ? "Sending..." : "Send Broadcast"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
