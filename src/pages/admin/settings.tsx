import { useState, useEffect } from "react";
import { customFetch } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Settings2,
  Plus,
  Pencil,
  Trash2,
  Globe,
  Lock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PlatformSetting {
  key: string;
  value: string;
  description: string | null;
  isPublic: boolean;
  updatedAt: string;
  updatedBy: string | null;
}

export default function AdminSettings() {
  const { toast } = useToast();

  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<PlatformSetting | null>(null);
  const [deleting, setDeleting] = useState<PlatformSetting | null>(null);
  const [formKey, setFormKey] = useState("");
  const [formValue, setFormValue] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIsPublic, setFormIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await customFetch<{ data: PlatformSetting[] }>("/api/v1/admin/settings");
      setSettings(res.data);
    } catch (err: any) {
      toast({ title: "Failed to load settings", description: err?.data?.error ?? err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const openCreate = () => {
    setEditing(null);
    setFormKey("");
    setFormValue("");
    setFormDescription("");
    setFormIsPublic(false);
    setEditOpen(true);
  };

  const openEdit = (setting: PlatformSetting) => {
    setEditing(setting);
    setFormKey(setting.key);
    setFormValue(setting.value);
    setFormDescription(setting.description ?? "");
    setFormIsPublic(setting.isPublic);
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!formKey.trim() || !formValue.trim()) {
      toast({ title: "Required fields", description: "Key and value are required.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      await customFetch(`/api/v1/admin/settings/${encodeURIComponent(formKey)}`, {
        method: "PUT",
        body: JSON.stringify({
          value: formValue,
          description: formDescription || null,
          isPublic: formIsPublic,
        }),
      });
      toast({ title: editing ? "Setting updated" : "Setting created", description: `"${formKey}" saved successfully.` });
      setEditOpen(false);
      fetchSettings();
    } catch (err: any) {
      toast({ title: "Save failed", description: err?.data?.error ?? err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setIsSaving(true);
    try {
      await customFetch(`/api/v1/admin/settings/${encodeURIComponent(deleting.key)}`, { method: "DELETE" });
      toast({ title: "Setting deleted", description: `"${deleting.key}" removed.` });
      setDeleteOpen(false);
      setDeleting(null);
      fetchSettings();
    } catch (err: any) {
      toast({ title: "Delete failed", description: err?.data?.error ?? err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Platform Settings
            </CardTitle>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Setting
            </Button>
          </div>
          <CardDescription>
            Manage platform-wide configuration key-value pairs. Changes apply immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded" />)}
            </div>
          ) : settings.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Settings2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>No platform settings configured yet.</p>
              <Button variant="outline" className="mt-4" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Add your first setting
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Key</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings.map((s) => (
                    <TableRow key={s.key} className="text-sm">
                      <TableCell>
                        <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{s.key}</code>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="text-xs truncate">{s.value}</p>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="text-xs text-muted-foreground truncate">{s.description ?? "—"}</p>
                      </TableCell>
                      <TableCell>
                        {s.isPublic ? (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Globe className="h-3 w-3" />
                            Public
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Lock className="h-3 w-3" />
                            Private
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(s.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => { setDeleting(s); setDeleteOpen(true); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Setting" : "Add Setting"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update the platform configuration value." : "Create a new platform configuration entry."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="setting-key">Key</Label>
              <Input
                id="setting-key"
                placeholder="e.g. MAINTENANCE_MODE"
                value={formKey}
                onChange={(e) => setFormKey(e.target.value)}
                disabled={!!editing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="setting-value">Value</Label>
              <Textarea
                id="setting-value"
                placeholder="Setting value..."
                rows={3}
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="setting-description">Description (optional)</Label>
              <Input
                id="setting-description"
                placeholder="What this setting controls..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch id="setting-public" checked={formIsPublic} onCheckedChange={setFormIsPublic} />
              <Label htmlFor="setting-public" className="text-sm">Visible to users (public)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Setting</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{deleting?.key}</code>?
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteOpen(false); setDeleting(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isSaving}>
              {isSaving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
