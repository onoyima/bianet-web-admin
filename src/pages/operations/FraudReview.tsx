import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { customFetch } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, ShieldCheck, XCircle, Eye } from "lucide-react";

export default function OpsFraudReview() {
  const { toast } = useToast();
  const [escrows, setEscrows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [decision, setDecision] = useState("");
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchEscrows = async (status?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (status) params.set("status", status);
      const res = await customFetch<any>(`/api/v1/admin/escrow?${params}`);
      setEscrows(res.data ?? []);
    } catch (err: any) {
      toast({ title: "Failed to load", description: err?.data?.error ?? err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selected || !decision) return;
    setProcessing(true);
    try {
      await customFetch(`/api/v1/admin/escrow/${selected.id}/resolve`, {
        method: "POST",
        body: JSON.stringify({ decision, notes }),
      });
      toast({ title: "Dispute resolved", description: `Decision: ${decision}` });
      setOpen(false);
      setSelected(null);
      setDecision("");
      setNotes("");
      fetchEscrows("DISPUTED");
    } catch (err: any) {
      toast({ title: "Failed to resolve", description: err?.data?.error ?? err.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Fraud Review</h2>
          <p className="text-muted-foreground mt-1">Review flagged transactions and suspicious activity.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchEscrows()}>All Escrows</Button>
          <Button variant="outline" size="sm" onClick={() => fetchEscrows("DISPUTED")}>Disputed</Button>
          <Button variant="outline" size="sm" onClick={() => fetchEscrows("RELEASED")}>Released</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" /> Flagged Escrows</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded" />)}</div>
          ) : escrows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>No escrows to review.</p></div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Reference</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {escrows.map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono text-xs">{e.reference ?? e.id?.substring(0, 8)}...</TableCell>
                      <TableCell className="font-medium">{e.currency || "NGN"} {e.amount?.toLocaleString() ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={e.status === "RELEASED" ? "default" : e.status === "DISPUTED" ? "destructive" : e.status === "HELD" ? "secondary" : "outline"}>
                          {e.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{e.platform ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Dialog open={open && selected?.id === e.id} onOpenChange={(v) => { setOpen(v); if (!v) setSelected(null); }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelected(e)}><Eye className="h-4 w-4 mr-1" /> Review</Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Review Escrow</DialogTitle>
                              <DialogDescription>Reference: {e.reference ?? e.id}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="text-muted-foreground">Amount:</span> <span className="font-medium">{e.currency || "NGN"} {e.amount?.toLocaleString()}</span></div>
                                <div><span className="text-muted-foreground">Status:</span> <Badge variant="outline">{e.status}</Badge></div>
                                <div><span className="text-muted-foreground">Platform:</span> <span>{e.platform}</span></div>
                                <div><span className="text-muted-foreground">Created:</span> <span>{new Date(e.createdAt).toLocaleString()}</span></div>
                              </div>
                              <div className="space-y-2">
                                <Label>Decision</Label>
                                <div className="flex gap-2">
                                  <Button variant={decision === "RELEASE" ? "default" : "outline"} className="flex-1" onClick={() => setDecision("RELEASE")}>
                                    <ShieldCheck className="h-4 w-4 mr-2" /> Release
                                  </Button>
                                  <Button variant={decision === "REFUND" ? "destructive" : "outline"} className="flex-1" onClick={() => setDecision("REFUND")}>
                                    <XCircle className="h-4 w-4 mr-2" /> Refund
                                  </Button>
                                  <Button variant={decision === "SPLIT" ? "secondary" : "outline"} className="flex-1" onClick={() => setDecision("SPLIT")}>
                                    Split
                                  </Button>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea id="notes" placeholder="Reasoning and notes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => { setOpen(false); setSelected(null); }}>Cancel</Button>
                              <Button onClick={handleResolve} disabled={!decision || processing}>
                                {processing ? "Processing..." : "Submit Decision"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
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
