import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { customFetch } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Shield, CheckCircle2, XCircle, AlertTriangle, Eye } from "lucide-react";

export default function AIModeration() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await customFetch<any[]>("/api/v1/ai/moderation/queue").catch(() => null);
      setItems(res ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleAction = async (id: string, action: "APPROVED" | "REJECTED") => {
    setProcessing(true);
    try {
      await customFetch(`/api/v1/ai/moderation/${id}/review`, {
        method: "POST",
        body: JSON.stringify({ action, notes: reviewNotes }),
      });
      toast({ title: `Content ${action.toLowerCase()}`, description: `Moderation action recorded.` });
      setOpen(false);
      setSelected(null);
      setReviewNotes("");
      fetchItems();
    } catch (err: any) {
      toast({ title: "Failed to update", description: err?.data?.error ?? err.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Moderation Review</h2>
        <p className="text-muted-foreground mt-1">Review AI-flagged content and approve or dismiss moderation actions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Flagged Content Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded" />)}</div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-lg font-medium">No items to review</p>
              <p className="text-sm">All AI-flagged content has been reviewed.</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Type</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Flagged</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell><Badge variant="outline">{item.contentType ?? "GENERAL"}</Badge></TableCell>
                      <TableCell className="max-w-xs truncate">{item.content ?? item.text ?? "—"}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-xs text-amber-600">
                          <AlertTriangle className="h-3 w-3" />
                          {item.reason ?? "Flagged by AI"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.confidence > 0.8 ? "destructive" : item.confidence > 0.5 ? "secondary" : "outline"}>
                          {item.confidence ? `${(item.confidence * 100).toFixed(0)}%` : "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => { setSelected(item); setOpen(true); }}>
                          <Eye className="h-4 w-4 mr-1" /> Review
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

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSelected(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Flagged Content</DialogTitle>
            <DialogDescription>Review the AI moderation result and take action.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-lg bg-muted/30 text-sm">
              <p className="text-muted-foreground mb-1">Flagged Content:</p>
              <p className="font-medium">{selected?.content ?? selected?.text ?? "—"}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Type:</span> <Badge variant="outline">{selected?.contentType ?? "GENERAL"}</Badge></div>
              <div><span className="text-muted-foreground">Reason:</span> <span className="text-amber-600">{selected?.reason ?? "AI Flagged"}</span></div>
              <div><span className="text-muted-foreground">Confidence:</span> <span>{selected?.confidence ? `${(selected.confidence * 100).toFixed(0)}%` : "—"}</span></div>
              <div><span className="text-muted-foreground">Flagged by:</span> <span>{selected?.flaggedBy ?? "AI Moderator"}</span></div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mod-notes">Review Notes</Label>
              <Textarea id="mod-notes" placeholder="Optional notes..." value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setOpen(false); setSelected(null); }}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => handleAction(selected.id, "REJECTED")}
              disabled={processing}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" /> Dismiss Flag
            </Button>
            <Button
              onClick={() => handleAction(selected.id, "APPROVED")}
              disabled={processing}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" /> Approve Content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
