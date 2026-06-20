import { useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Save,
  Package,
  Upload,
  Trash2,
  Loader2,
  Plus,
} from "lucide-react";
import { customFetch } from "@workspace/api-client-react";

interface SeedListing {
  id: string;
  sellerId?: string;
  seller_id?: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  quantity: number;
  unit: string;
  category: string;
  status: string;
  state: string | null;
  country: string;
  isFeatured?: boolean;
  is_featured?: boolean;
  viewCount?: number;
  view_count?: number;
  imageUrls?: string[] | null;
  image_urls?: string[] | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

function camelize(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    result[camelize(key)] = obj[key];
  }
  return result;
}

export default function SeedListingDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<SeedListing>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !listing) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await customFetch<{ url: string; key: string }>("/api/v1/seed/listings/images/upload", {
        method: "POST",
        body: formData,
      });
      const currentUrls = listing.imageUrls || [];
      await updateListing.mutateAsync({ imageUrls: [...currentUrls, result.url] });
      toast({ title: "Image added", description: "Image uploaded and added to listing." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.data?.error ?? err.message, variant: "destructive" });
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleRemoveImage = async (urlToRemove: string) => {
    if (!listing) return;
    const currentUrls = listing.imageUrls || [];
    const updatedUrls = currentUrls.filter((url) => url !== urlToRemove);
    try {
      await updateListing.mutateAsync({ imageUrls: updatedUrls });
      toast({ title: "Image removed", description: "Image has been removed from the listing." });
    } catch (err: any) {
      toast({ title: "Remove failed", description: err?.data?.error ?? err.message, variant: "destructive" });
    }
  };

  const { data: rawListing, isLoading, isError, error } = useQuery({
    queryKey: ["seedListing", id],
    queryFn: async () => {
      const res = await customFetch<Record<string, unknown>>(`/api/v1/admin/listings/seed/${id}`);
      return toCamelCase(res) as unknown as SeedListing;
    },
    retry: false,
  });
  const listing = rawListing;

  const updateListing = useMutation({
    mutationFn: async (data: Partial<SeedListing>) => {
      return customFetch(`/api/v1/admin/listings/seed/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seedListing", id] });
      toast({ title: "Listing updated", description: "Seed listing updated successfully!" });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({ title: "Update failed", description: error.message || "Could not update listing", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isError || !listing) {
    const status = (error as any)?.status;
    const message = (error as any)?.data?.error || error?.message || "Could not load listing";
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <h2 className="text-xl font-semibold">
          {status === 404 ? "Listing not found" : "Error loading listing"}
        </h2>
        <p className="text-muted-foreground mt-2">
          {status === 404
            ? "This listing may have been deleted or you may have followed an invalid link."
            : message}
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setLocation("/admin/seed-listings")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to listings
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => setLocation("/admin/seed-listings")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{listing.title}</h1>
          <p className="text-muted-foreground">{listing.category} • {listing.state || listing.country}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Images</CardTitle>
            <Button
              variant="outline"
              size="sm"
              disabled={uploadingImage}
              onClick={() => imageInputRef.current?.click()}
            >
              {uploadingImage ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {uploadingImage ? "Uploading..." : "Add Image"}
            </Button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadImage}
              disabled={uploadingImage}
            />
          </CardHeader>
          <CardContent>
            {listing.imageUrls && listing.imageUrls.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {listing.imageUrls.map((url, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={url}
                      alt={`Image ${i + 1}`}
                      className="w-full aspect-square rounded object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(url)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>No images</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Details</CardTitle>
            <Button
              variant="outline"
              onClick={() => {
                if (isEditing) {
                  setIsEditing(false);
                } else {
                  setEditData(listing);
                  setIsEditing(true);
                }
              }}
            >
              {isEditing ? "Cancel" : "Edit"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={editData.title || ""}
                      onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={editData.category || listing.category}
                      onValueChange={(val) => setEditData({ ...editData, category: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VEGETABLES">Vegetables</SelectItem>
                        <SelectItem value="FRUITS">Fruits</SelectItem>
                        <SelectItem value="GRAINS">Grains</SelectItem>
                        <SelectItem value="TUBERS">Tubers</SelectItem>
                        <SelectItem value="LIVESTOCK">Livestock</SelectItem>
                        <SelectItem value="FISHERIES">Fisheries</SelectItem>
                        <SelectItem value="OTHERS">Others</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      value={editData.price || 0}
                      onChange={(e) => setEditData({ ...editData, price: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={editData.currency || listing.currency}
                      onValueChange={(val) => setEditData({ ...editData, currency: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NGN">NGN</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={editData.quantity || 0}
                      onChange={(e) => setEditData({ ...editData, quantity: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editData.description || ""}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={editData.status || listing.status}
                      onValueChange={(val) => setEditData({ ...editData, status: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="SOLD">Sold</SelectItem>
                        <SelectItem value="EXPIRED">Expired</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={editData.state || ""}
                      onChange={(e) => setEditData({ ...editData, state: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={editData.country || listing.country}
                      onChange={(e) => setEditData({ ...editData, country: e.target.value })}
                    />
                  </div>
                </div>

                <Button onClick={() => {
                  updateListing.mutate(editData);
                }} disabled={updateListing.isPending}>
                  {updateListing.isPending ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  ) : <Save className="h-4 w-4 mr-2" />}
                  {updateListing.isPending ? "Updating..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="font-semibold text-lg">
                      {(listing.currency === "NGN" ? "₦" : "$")}{listing.price.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quantity</p>
                    <p className="font-semibold text-lg">{listing.quantity.toLocaleString()} {listing.unit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-semibold text-lg">{listing.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Views</p>
                    <p className="font-semibold text-lg">{listing.viewCount.toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-gray-800">{listing.description}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
