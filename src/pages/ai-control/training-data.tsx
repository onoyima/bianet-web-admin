import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BookOpen, Upload, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AITrainingData() {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Training Data</h1>
          <p className="text-muted-foreground mt-1">Manage training datasets for AI models</p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" /> Upload Dataset
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search datasets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Training Datasets</CardTitle>
          <CardDescription>Available training datasets for model training</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dataset Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Moderation Dataset</TableCell>
                <TableCell>Content Moderation</TableCell>
                <TableCell>50,000</TableCell>
                <TableCell>2024-01-15</TableCell>
                <TableCell><Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Active</Badge></TableCell>
                <TableCell className="text-right"><Button variant="ghost" size="sm">View</Button></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Price History</TableCell>
                <TableCell>Analytics</TableCell>
                <TableCell>250,000</TableCell>
                <TableCell>2024-01-20</TableCell>
                <TableCell><Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Active</Badge></TableCell>
                <TableCell className="text-right"><Button variant="ghost" size="sm">View</Button></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}