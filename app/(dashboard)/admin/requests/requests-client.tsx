"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ShieldWarningIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TagIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
} from "@phosphor-icons/react";
import { useAlertHelpers } from "@/components/ui/alert-toast";

type Request = {
  id: string;
  title: string;
  description: string;
  category: {
    name: string;
    slug: string;
  };
  client: {
    email: string;
    full_name: string | null;
  };
  budget_range: string | null;
  location: string | null;
  status: string;
  deadline: string | null;
  unlock_fee: number;
  total_unlocks: number;
  created_at: string;
};

export default function RequestsClient({
  initialRequests,
}: {
  initialRequests: Request[];
}) {
  const [requests, setRequests] = useState<Request[]>(initialRequests);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isModerateOpen, setIsModerateOpen] = useState(false);
  const [moderationAction, setModerationAction] = useState<"approve" | "reject">("approve");
  const [moderationReason, setModerationReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { success, error } = useAlertHelpers();

  const refreshRequests = async () => {
    try {
      const res = await fetch("/api/requests?limit=100", {
        credentials: "include",
      });
      if (res.ok) {
        const json = await res.json();
        setRequests(json.data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleModerate = async () => {
    if (!selectedRequest) return;

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/requests/${selectedRequest.id}/moderate`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: moderationAction === "approve" ? "published" : "cancelled",
          reason: moderationReason || "Moderated by admin",
        }),
      });

      if (res.ok) {
        setIsModerateOpen(false);
        setSelectedRequest(null);
        setModerationReason("");
        await refreshRequests();
        await success(`Request ${moderationAction === "approve" ? "approved" : "rejected"} successfully`);
      } else {
        const errorData = await res.json();
        await error(errorData.error?.message || errorData.message || "Moderation failed");
      }
    } catch (e) {
      await error("Network error occurred");
    } finally {
      setIsProcessing(false);
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
            <XCircleIcon className="mr-1 size-3" />
            Closed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50/50 dark:bg-background">
      <Topbar title="Requests Moderation" />
      <main className="flex-1 p-6 w-full max-w-7xl mx-auto space-y-6 pb-20">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Service Requests
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Review and moderate service requests on the platform
          </p>
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[300px]">Request</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Unlocks</TableHead>
                  <TableHead>Posted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No requests found
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
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {request.client.full_name || "Anonymous"}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {request.client.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <TagIcon className="mr-1 size-3" />
                          {request.category.name}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="font-medium">
                        {request.total_unlocks}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequest(request);
                            setIsModerateOpen(true);
                          }}
                        >
                          <ShieldWarningIcon className="mr-1.5 size-4" />
                          Moderate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Request Detail Dialog */}
        <Dialog
          open={!!selectedRequest && !isModerateOpen}
          onOpenChange={(open) => !open && setSelectedRequest(null)}
        >
          <DialogContent className="max-w-2xl overflow-y-auto max-h-[90dvh]">
            <DialogHeader>
              <DialogTitle>{selectedRequest?.title}</DialogTitle>
              <DialogDescription>Request details and information</DialogDescription>
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
                      <Badge variant="outline">{selectedRequest.category.name}</Badge>
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
                      <div className="flex items-center gap-1.5">
                        <MapPinIcon className="size-4 text-muted-foreground" />
                        <span className="font-medium">
                          {selectedRequest.location || "Remote"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Deadline
                      </span>
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="size-4 text-muted-foreground" />
                        <span className="font-medium">
                          {selectedRequest.deadline
                            ? format(new Date(selectedRequest.deadline), "MMM d, yyyy")
                            : "Flexible"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Unlock Fee
                      </span>
                      <div className="flex items-center gap-1.5">
                        <CurrencyDollarIcon className="size-4 text-muted-foreground" />
                        <span className="font-medium font-mono">
                          {selectedRequest.unlock_fee.toFixed(2)} EGP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => setIsModerateOpen(true)}
                >
                  <ShieldWarningIcon className="mr-2 size-4" />
                  Moderate Request
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Moderation Dialog */}
        <Dialog open={isModerateOpen} onOpenChange={setIsModerateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Moderate Request</DialogTitle>
              <DialogDescription>
                Approve or reject this service request
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Action</Label>
                <div className="flex gap-3 mt-2">
                  <Button
                    variant={moderationAction === "approve" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setModerationAction("approve")}
                  >
                    <CheckCircleIcon className="mr-2 size-4" />
                    Approve
                  </Button>
                  <Button
                    variant={moderationAction === "reject" ? "destructive" : "outline"}
                    className="flex-1"
                    onClick={() => setModerationAction("reject")}
                  >
                    <XCircleIcon className="mr-2 size-4" />
                    Reject
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter moderation reason..."
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  rows={3}
                  className="mt-1.5"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1"
                  onClick={handleModerate}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Confirm"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsModerateOpen(false);
                    setModerationReason("");
                  }}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
