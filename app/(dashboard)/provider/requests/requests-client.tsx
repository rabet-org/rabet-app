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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  TagIcon,
  LockKeyIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAlertHelpers } from "@/components/ui/alert-toast";

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
  deadline: string | null;
  unlock_fee: number;
  created_at: string;
  total_unlocks: number;
};

export function RequestsClient({
  initialRequests,
}: {
  initialRequests: Request[];
}) {
  const [requests, setRequests] = useState<Request[]>(initialRequests);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const { success, error, confirm } = useAlertHelpers();

  const handleUnlock = async (requestId: string) => {
    const confirmed = await confirm(
      "Are you sure you want to unlock this request? This will deduct credits from your wallet.",
      "Unlock Request"
    );
    if (!confirmed) return;

    setIsUnlocking(true);
    try {
      const res = await fetch(`/api/requests/${requestId}/unlock`, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        await success("Request unlocked successfully! Check your leads page.");
        setSelectedRequest(null);
        // Refresh the list
        const refreshRes = await fetch("/api/requests?limit=50", {
          credentials: "include",
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setRequests(data.data.data || []);
        }
      } else {
        const errorData = await res.json();
        await error(errorData.message || "Failed to unlock request");
      }
    } catch (e) {
      await error("Network error occurred");
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50/50 dark:bg-background">
      <Topbar title="Browse Requests" />
      <main className="flex-1 p-6 w-full max-w-7xl mx-auto space-y-6 pb-20">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Available Service Requests
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Browse and unlock client requests to get their contact information
          </p>
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[350px]">Request</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Unlock Fee</TableHead>
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
                      No requests available at the moment. Check back later!
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
                        <div className="font-medium group-hover:text-primary transition-colors line-clamp-1">
                          {request.title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {request.description}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(request.created_at), "MMM d")}
                          </span>
                          {request.total_unlocks > 0 && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            >
                              <UsersIcon className="mr-1 size-3" />
                              {request.total_unlocks} unlocked
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <TagIcon className="mr-1 size-3" />
                          {request.category.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {request.budget_range || "Not specified"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {request.location || "Remote"}
                      </TableCell>
                      <TableCell className="font-mono font-medium text-sm">
                        {request.unlock_fee.toFixed(2)} EGP
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="default"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequest(request);
                          }}
                        >
                          <LockKeyIcon className="mr-1.5 size-4" />
                          Unlock
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
          open={!!selectedRequest}
          onOpenChange={(open) => !open && setSelectedRequest(null)}
        >
          <DialogContent className="max-w-2xl overflow-y-auto max-h-[90dvh]">
            <DialogHeader>
              <DialogTitle>{selectedRequest?.title}</DialogTitle>
              <DialogDescription>
                Review the request details before unlocking
              </DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-5 pb-1">
                {/* Description */}
                <div className="rounded-xl border bg-card">
                  <div className="px-4 py-2.5 border-b">
                    <h4 className="text-sm font-semibold">Description</h4>
                  </div>
                  <p className="p-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {selectedRequest.description}
                  </p>
                </div>

                {/* Request Details */}
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
                            ? format(
                                new Date(selectedRequest.deadline),
                                "MMM d, yyyy"
                              )
                            : "Flexible"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Posted On
                      </span>
                      <span className="font-medium">
                        {format(
                          new Date(selectedRequest.created_at),
                          "MMM d, yyyy"
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Providers Interested
                      </span>
                      <span className="font-medium">
                        {selectedRequest.total_unlocks} unlocked
                      </span>
                    </div>
                  </div>
                </div>

                {/* Unlock Fee */}
                <div className="rounded-xl border bg-primary/5 border-primary/20">
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold mb-1">
                        Unlock Fee
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        This amount will be deducted from your wallet
                      </p>
                    </div>
                    <div className="text-2xl font-bold font-mono">
                      {selectedRequest.unlock_fee.toFixed(2)} EGP
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  className="w-full"
                  size="lg"
                  disabled={isUnlocking}
                  onClick={() => handleUnlock(selectedRequest.id)}
                >
                  <LockKeyIcon className="mr-2 size-5" />
                  {isUnlocking
                    ? "Processing..."
                    : `Unlock for ${selectedRequest.unlock_fee.toFixed(2)} EGP`}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
