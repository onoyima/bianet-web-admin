import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Building2, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import { adminApi } from "../../lib/admin-api";

interface EnterpriseRow {
  id: string;
  companyName: string;
  ownerName: string;
  phone: string;
  email: string;
  cacNumber: string;
  companyType: string;
  state: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  dateApplied: string;
}

export default function AdminEnterprises() {
  const { toast } = useToast();
  const [rows, setRows] = useState<EnterpriseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("PENDING");
  const [actionTarget, setActionTarget] = useState<EnterpriseRow | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadEnterprises = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.enterprises.list({ approvalStatus: activeTab });
      setRows(
        (res.data as any[]).map((e: any) => ({
          id: e.id,
          companyName: e.companyName,
          ownerName: e.profile ? `${e.profile.firstName} ${e.profile.lastName}` : e.user?.phone ?? "—",
          phone: e.user?.phone ?? "—",
          email: e.user?.email ?? "—",
          cacNumber: e.cacRegNumber,
          companyType: e.companyType,
          state: e.state,
          status: e.approvalStatus,
          dateApplied: e.createdAt,
        })),
      );
    } catch (e: any) {
      toast({ title: "Failed to load enterprises", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [activeTab, toast]);

  useEffect(() => { loadEnterprises(); }, [loadEnterprises]);

  const openAction = (ent: EnterpriseRow, type: "approve" | "reject") => {
    setActionTarget(ent);
    setActionType(type);
    setRejectReason("");
  };

  const handleApprove = async () => {
    if (!actionTarget) return;
    try {
      await adminApi.enterprises.approve(actionTarget.id);
      toast({ title: "Enterprise approved", description: `${actionTarget.companyName} has been approved.` });
      setActionTarget(null);
      setActionType(null);
      loadEnterprises();
    } catch (e: any) {
      toast({ title: "Approval failed", description: e.message, variant: "destructive" });
    }
  };

  const handleReject = async () => {
    if (!actionTarget) return;
    if (rejectReason.trim().length < 10) {
      toast({ title: "Reason required", description: "Please provide at least 10 characters explaining the rejection.", variant: "destructive" });
      return;
    }
    try {
      await adminApi.enterprises.reject(actionTarget.id, rejectReason.trim());
      toast({ title: "Enterprise rejected", description: `${actionTarget.companyName} has been rejected.` });
      setActionTarget(null);
      setActionType(null);
      loadEnterprises();
    } catch (e: any) {
      toast({ title: "Rejection failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Enterprise Approvals
          </CardTitle>
          <CardDescription>Review and approve enterprise registrations for the Bartar exchange</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="PENDING">Pending</TabsTrigger>
              <TabsTrigger value="APPROVED">Approved</TabsTrigger>
              <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab}>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : rows.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Building2 className="h-8 w-8 mx-auto mb-3 opacity-20" />
                  <p>No {activeTab.toLowerCase()} enterprises.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Company Type</TableHead>
                      <TableHead>CAC Number</TableHead>
                      <TableHead>Date Applied</TableHead>
                      {activeTab === "PENDING" && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.companyName}</TableCell>
                        <TableCell>{e.ownerName}</TableCell>
                        <TableCell className="font-mono text-xs">{e.phone}</TableCell>
                        <TableCell><Badge variant="outline">{e.companyType}</Badge></TableCell>
                        <TableCell className="font-mono text-xs">{e.cacNumber}</TableCell>
                        <TableCell className="text-sm">{new Date(e.dateApplied).toLocaleDateString()}</TableCell>
                        {activeTab === "PENDING" && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => openAction(e, "approve")}>
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => openAction(e, "reject")}>
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={actionType === "approve"} onOpenChange={(o) => { if (!o) { setActionTarget(null); setActionType(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              Approve Enterprise
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to approve <strong>{actionTarget?.companyName}</strong>?
              They will gain full access to the Bartar exchange.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionTarget(null); setActionType(null); }}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove}>
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionType === "reject"} onOpenChange={(o) => { if (!o) { setActionTarget(null); setActionType(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Reject Enterprise
            </DialogTitle>
            <DialogDescription>
              Rejecting <strong>{actionTarget?.companyName}</strong> will prevent them from registering on the exchange.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label>Reason for rejection (min 10 characters)</Label>
            <Textarea
              className="mt-2"
              placeholder="Explain why this application is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">{rejectReason.trim().length} / 10 characters</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionTarget(null); setActionType(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejectReason.trim().length < 10}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
