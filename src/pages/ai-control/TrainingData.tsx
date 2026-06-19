import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { customFetch } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Database, Plus, Upload, Search, FileText, CheckCircle2, XCircle } from "lucide-react";

const DEFAULT_DATASETS = [
  { id: "1", name: "Content Moderation Dataset", type: "TEXT", size: 12500, labeled: 11200, status: "READY", created: "2026-06-01" },
  { id: "2", name: "Fraud Transactions", type: "STRUCTURED", size: 45000, labeled: 42300, status: "READY", created: "2026-05-15" },
  { id: "3", name: "Product Images", type: "IMAGE", size: 8900, labeled: 5600, status: "LABELING", created: "2026-06-10" },
  { id: "4", name: "Trade Descriptions", type: "TEXT", size: 3200, labeled: 0, status: "PENDING", created: "2026-06-18" },
];

export default function AITrainingData() {
  const { toast } = useToast();
  const [datasets] = useState(DEFAULT_DATASETS);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("TEXT");
  const [formDescription, setFormDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = search.trim()
    ? datasets.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))
    : datasets;

  const handleCreate = async () => {
    if (!formName.trim()) return;
    setCreating(true);
    try {
      await customFetch("/api/v1/ai/datasets", {
        method: "POST",
        body: JSON.stringify({ name: formName, type: formType, description: formDescription }),
      });
      toast({ title: "Dataset created", description: `${formName} initialized.` });
      setCreateOpen(false);
      setFormName("");
      setFormType("TEXT");
      setFormDescription("");
    } catch (err: any) {
      toast({ title: "Failed to create dataset", description: err?.data?.error ?? err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Training Data</h2>
          <p className="text-muted-foreground mt-1">Upload, label, and manage datasets for model training.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><Upload className="h-4 w-4" /> Upload Data</Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> New Dataset</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Dataset</DialogTitle>
                <DialogDescription>Define a new training dataset.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="ds-name">Dataset Name</Label>
                  <Input id="ds-name" placeholder="e.g. Product Categories" value={formName} onChange={(e) => setFormName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={formType} onValueChange={setFormType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEXT">Text</SelectItem>
                      <SelectItem value="IMAGE">Image</SelectItem>
                      <SelectItem value="STRUCTURED">Structured Data</SelectItem>
                      <SelectItem value="AUDIO">Audio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ds-desc">Description</Label>
                  <Textarea id="ds-desc" placeholder="Optional description..." value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={2} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!formName.trim() || creating}>{creating ? "Creating..." : "Create Dataset"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> Datasets</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9 w-48" placeholder="Search datasets..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <CardDescription>Manage training datasets and labeling progress.</CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Database className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>No datasets found.</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Dataset</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Total Samples</TableHead>
                    <TableHead>Labeled</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell><Badge variant="outline">{d.type}</Badge></TableCell>
                      <TableCell>{d.size.toLocaleString()}</TableCell>
                      <TableCell>{d.labeled.toLocaleString()}</TableCell>
                      <TableCell className="min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${d.size > 0 ? (d.labeled / d.size) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-10 text-right">
                            {d.size > 0 ? `${Math.round((d.labeled / d.size) * 100)}%` : "0%"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={d.status === "READY" ? "default" : d.status === "LABELING" ? "secondary" : "outline"}>
                          {d.status === "READY" ? <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Ready</span> : d.status === "LABELING" ? "Labeling" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(d.created).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Upload className="h-5 w-5" /> Recent Uploads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No recent uploads. Use the "Upload Data" button to add training data.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
