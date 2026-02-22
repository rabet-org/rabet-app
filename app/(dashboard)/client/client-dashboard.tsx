"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PlusIcon,
  ClipboardTextIcon,
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  TagIcon,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAlertHelpers } from "@/components/ui/alert-toast";
import Link from "next/link";

type Request = {
  id: string;
  title: string;
  description: string;
  category: {
    name: string;
    slug: string;
  };
  budget_range: string | null;
  location: string | null;
  status: string;
  deadline: string | null;
  unlock_fee: number;
  total_unlocks: number;
  created_at: string;
  updated_at: string;
};

type Category = {
  id: string;
  slug: string;
  name: string;
};

export function ClientDashboardClient({
  initialRequests,
  categories,
}: {
  initialRequests: Request[];
  categories: Category[];
}) {
  const [requests, setRequests] = useState<Request[]>(initialRequests);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [location, setLocation] = useState("");
  const [deadline, setDeadline] = useState("");

  const { success, error } = useAlertHelpers();

  const refreshRequests = async () => {
    try {
      const res = await fetch("/api/requests/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateRequest = async () => {
    if (!title || !description || !categoryId) {
      await error("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: categoryId,
          title,
          description,
          budget_range: budgetRange || null,
          location: location || null,
          deadline: deadline || null,
        }),
      });

      if (res.ok) {
        setIsCreateOpen(false);
        setTitle("");
        setDescription("");
        setCategoryId("");
        setBudgetRange("");
        setLocation("");
        setDeadline("");
        await refreshRequests();
        await success("Request created successfully");
      } else {
        const errorData = await res.json();
        await error(errorData.message || "Failed to create request");
      }
    } catch (e) {
      await error("Network error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          >
            <CheckCircleIcon className="mr-1 size-3" />
            Published
          </Badge>
        );
      case "draft":
        return (
          <Badge
            variant="outline"
            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
          >
            <ClockIcon className="mr-1 size-3" />
            Draft
          </Badge>
        );
      case "closed":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Closed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = {
    total: requests.length,
    published: requests.filter((r) => r.status === "published").length,
    totalUnlocks: requests.reduce((sum, r) => sum + r.total_unlocks, 0),
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50/50 dark:bg-background">
      <Topbar title="Client Overview" />
      <main className="flex-1 p-6 w-full max-w-7xl mx-auto space-y-6 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              My Service Requests
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your posted requests and track provider interest
            </p>
          </div>
          <Link href="/client/requests/new">
            <Button>
              <PlusIcon className="mr-2 size-4" />
              Create New Request
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Total Requests
              </span>
              <ClipboardTextIcon className="size-5 text-primary" />
            </div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Active Requests
              </span>
              <CheckCircleIcon className="size-5 text-emerald-500" />
            </div>
            <div className="text-3xl font-bold">{stats.published}</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Total Provider Interest
              </span>
              <UsersIcon className="size-5 text-primary" />
            </div>
            <div className="text-3xl font-bold">{stats.totalUnlocks}</div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardTextIcon className="size-12 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.slice(0, 5).map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedRequest(request)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{request.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {request.total_unlocks} providers interested
                    </div>
                  </div>
                  <div className="ml-4">{getStatusBadge(request.status)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Requests Table */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[300px]">Request</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provider Interest</TableHead>
                  <TableHead>Posted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground"
                    >
                      <ClipboardTextIcon className="size-12 mx-auto mb-2 opacity-50" />
                      <p>No requests yet</p>
                      <Link href="/client/requests/new">
                        <Button variant="link" className="mt-2">
                          Create your first request
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((request) => (
                    <TableRow
                      key={request.id}
                      className="group cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <TableCell>
                        <div className="font-medium group-hover:text-primary transition-colors">
                          {request.title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {request.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <TagIcon className="mr-1 size-3" />
                          {request.category.name}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <UsersIcon className="size-4 text-muted-foreground" />
                          <span className="font-medium">
                            {request.total_unlocks}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            providers
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(request.created_at), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequest(request);
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Create Request Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Service Request</DialogTitle>
              <DialogDescription>
                Post a new request to find service providers
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Need a web developer for e-commerce site"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project requirements in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Budget Range</Label>
                  <Input
                    id="budget"
                    placeholder="e.g., 5000-10000 EGP"
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Cairo or Remote"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="deadline">Deadline (Optional)</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1"
                  onClick={handleCreateRequest}
                  disabled={isCreating}
                >
                  {isCreating ? "Creating..." : "Create Request"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Request Detail Dialog */}
        <Dialog
          open={!!selectedRequest}
          onOpenChange={(open) => !open && setSelectedRequest(null)}
        >
          <DialogContent className="max-w-2xl overflow-y-auto max-h-[90dvh]">
            <DialogHeader>
              <DialogTitle>{selectedRequest?.title}</DialogTitle>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-5 pb-1">
                <div className="rounded-xl border bg-card">
                  <div className="px-4 py-2.5 border-b">
                    <h4 className="text-sm font-semibold">Description</h4>
                  </div>
                  <p className="p-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {selectedRequest.description}
                  </p>
                </div>

                <div className="rounded-xl border bg-card">
                  <div className="px-4 py-2.5 border-b">
                    <h4 className="text-sm font-semibold">Request Details</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4 p-4 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Category
                      </span>
                      <Badge variant="outline">
                        {selectedRequest.category.name}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Status
                      </span>
                      {getStatusBadge(selectedRequest.status)}
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Budget Range
                      </span>
                      <span className="font-medium">
                        {selectedRequest.budget_range || "Not specified"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Location
                      </span>
                      <span className="font-medium">
                        {selectedRequest.location || "Remote"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Provider Interest
                      </span>
                      <span className="font-medium">
                        {selectedRequest.total_unlocks} providers
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Unlock Fee
                      </span>
                      <span className="font-medium font-mono">
                        {selectedRequest.unlock_fee.toFixed(2)} EGP
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
