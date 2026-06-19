import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { customFetch } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Cpu, Plus, Play, Pause, RotateCcw, Settings2 } from "lucide-react";

const DEFAULT_MODELS = [
  { id: "1", name: "Content Moderation", version: "v2.1.0", status: "ACTIVE", accuracy: 94.2, type: "CLASSIFICATION", lastDeployed: "2026-06-15" },
  { id: "2", name: "Fraud Detection", version: "v1.8.3", status: "ACTIVE", accuracy: 96.8, type: "ANOMALY_DETECTION", lastDeployed: "2026-06-12" },
  { id: "3", name: "Recommendation Engine", version: "v3.0.1", status: "ACTIVE", accuracy: 89.5, type: "RECOMMENDATION", lastDeployed: "2026-06-10" },
  { id: "4", name: "Dispute Resolution", version: "v1.2.0", status: "STAGING", accuracy: 87.3, type: "CLASSIFICATION", lastDeployed: "2026-06-08" },
  { id: "5", name: "Price Prediction", version: "v2.0.0", status: "TRAINING", accuracy: 0, type: "REGRESSION", lastDeployed: "—" },
];

export default function AIModels() {
  const { toast } = useToast();
  const [models] = useState(DEFAULT_MODELS);
  const [createOpen, setCreateOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("CLASSIFICATION");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!formName.trim()) return;
    setCreating(true);
    try {
      await customFetch("/api/v1/ai/models", {
        method: "POST",
        body: JSON.stringify({ name: formName, type: formType }),
      });
      toast({ title: "Model created", description: `${formName} initialized.` });
      setCreateOpen(false);
      setFormName("");
      setFormType("CLASSIFICATION");
    } catch (err: any) {
      toast({ title: "Failed to create model", description: err?.data?.error ?? err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleDeploy = async (id: string) => {
    try {
      await customFetch(`/api/v1/ai/models/${id}/deploy`, { method: "POST" });
      toast({ title: "Model deployed" });
    } catch (err: any) {
      toast({ title: "Deployment failed", description: err?.data?.error ?? err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Model Configuration</h2>
          <p className="text-muted-foreground mt-1">Manage AI models, versions, parameters, and deployment settings.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Model</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Model</DialogTitle>
              <DialogDescription>Initialize a new AI model configuration.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="model-name">Model Name</Label>
                <Input id="model-name" placeholder="e.g. Price Prediction v3" value={formName} onChange={(e) => setFormName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLASSIFICATION">Classification</SelectItem>
                    <SelectItem value="REGRESSION">Regression</SelectItem>
                    <SelectItem value="RECOMMENDATION">Recommendation</SelectItem>
                    <SelectItem value="ANOMALY_DETECTION">Anomaly Detection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!formName.trim() || creating}>{creating ? "Creating..." : "Create Model"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5" /> AI Models</CardTitle>
          <CardDescription>Manage and monitor all deployed AI models.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Model</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Accuracy</TableHead>
                  <TableHead>Last Deployed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{m.version}</code></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.type.replace(/_/g, " ")}</TableCell>
                    <TableCell>
                      <Badge variant={m.status === "ACTIVE" ? "default" : m.status === "STAGING" ? "secondary" : m.status === "TRAINING" ? "outline" : "destructive"}>
                        {m.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{m.accuracy > 0 ? `${m.accuracy}%` : "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.lastDeployed !== "—" ? new Date(m.lastDeployed).toLocaleDateString() : "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {m.status === "ACTIVE" ? (
                          <Button variant="ghost" size="sm"><Pause className="h-4 w-4" /></Button>
                        ) : m.status === "STAGING" ? (
                          <Button variant="ghost" size="sm" onClick={() => handleDeploy(m.id)}><Play className="h-4 w-4 text-green-600" /></Button>
                        ) : null}
                        <Button variant="ghost" size="sm"><RotateCcw className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm"><Settings2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
