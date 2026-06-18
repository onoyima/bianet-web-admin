import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Users, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SupportUserLookup() {
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">User Lookup</h1>
          <p className="text-muted-foreground mt-1">Search for a user to view their details</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setSearching(true)}>Search</Button>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Search Results</CardTitle>
          <CardDescription>Users matching your search criteria</CardDescription>
        </CardHeader>
        <CardContent>
          {searching ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                No users found
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Enter a search query to find a user
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}