import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { customFetch } from "@workspace/api-client-react";
import { toast } from "sonner";
import { TrendingUp, Plus, Search } from "lucide-react";

export default function AdminPriceFeedPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    commodityName: "", grade: "", state: "", pricePerKg: "", currency: "NGN", source: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-price-feed", search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "200" });
      if (search) params.set("commodity", search);
      return customFetch<any[]>("/api/v1/bartar/price-feed?" + params);
    },
  });

  const createPrice = useMutation({
    mutationFn: async (body: any) =>
      customFetch<any>("/api/v1/bartar/price-feed", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success("Price recorded");
      queryClient.invalidateQueries({ queryKey: ["admin-price-feed"] });
      setDialogOpen(false);
      setForm({ commodityName: "", grade: "", state: "", pricePerKg: "", currency: "NGN", source: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = (field: string) => (e: any) =>
    setForm((prev) => ({ ...prev, [field]: e.target?.value ?? e }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Price Feed</h1>
          <p className="text-muted-foreground mt-1">Record and manage commodity market prices.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Plus className="h-4 w-4 mr-2" /> Record Price
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Commodity Price</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Commodity Name *</Label>
                <Input value={form.commodityName} onChange={update("commodityName")} placeholder="e.g. Sesame Seeds" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Grade</Label>
                  <Input value={form.grade} onChange={update("grade")} placeholder="Grade A" />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input value={form.state} onChange={update("state")} placeholder="Lagos" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (per kg) *</Label>
                  <Input type="number" value={form.pricePerKg} onChange={update("pricePerKg")} />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={form.currency} onValueChange={update("currency")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NGN">NGN</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Source</Label>
                <Input value={form.source} onChange={update("source")} placeholder="e.g. FMARD Report" />
              </div>
              <Button className="w-full" onClick={() => createPrice.mutate({ ...form, pricePerKg: parseInt(form.pricePerKg) })}>
                {createPrice.isPending ? "Submitting..." : "Record Price"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search prices..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : data?.length > 0 ? (
        <div className="space-y-2">
          {data.map((p: any) => (
            <Card key={p.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div>
                    <span className="font-medium">{p.commodityName}</span>
                    {p.grade && <Badge variant="outline" className="ml-2 text-xs">{p.grade}</Badge>}
                    {p.state && <span className="ml-2 text-sm text-muted-foreground">{p.state}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold">{p.currency} {p.pricePerKg?.toLocaleString()}/kg</span>
                  <span className="ml-3 text-xs text-muted-foreground">{new Date(p.recordedAt).toLocaleString()}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed rounded-lg bg-card">
          <p className="text-xl font-medium">No prices recorded yet</p>
        </div>
      )}
    </div>
  );
}
