"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShieldWarningIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TagIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UsersIcon,
  Eye,
  EyeClosed,
  MagnifyingGlassIcon,
  FunnelIcon,
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
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    created_at: string;
  };
  budget_range: string | null;
  location: string | null;
  status: string;
  deadline: string | null;
  unlock_fee: number;
  total_unlocks: number;
  created_at: string;
  updated_at: string;
  unlocks?: {
    id: string;
    unlocked_at: string;
    provider: {
      user: {
        email: string;
      };
      user_id: string;
    };
  }[];
};

export default function RequestsClient({
  initialRequests,
  initialTotal,
  initialSearch = "",
}: {
  initialRequests: Request[];
  initialTotal: number;
  initialSearch?: string;
}) {
  const [requests, setRequests] = useState<Request[]>(initialRequests);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isModerateOpen, setIsModerateOpen] = useState(false);
  const [moderationAction, setModerationAction] = useState<
    "approve" | "reject"
  >("approve");
  const [moderationReason, setModerationReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isClientRevealed, setIsClientRevealed] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<string>("recent");

  // Advanced Filters
  const [minFee, setMinFee] = useState<string>("");
  const [maxFee, setMaxFee] = useState<string>("");
  const [minUnlocks, setMinUnlocks] = useState<string>("");
  const [maxUnlocks, setMaxUnlocks] = useState<string>("");

  const { success, error } = useAlertHelpers();

  // Reset privacy state when a different request is selected
  useEffect(() => {
    setIsClientRevealed(false);
  }, [selectedRequest]);

  const filteredRequests = requests
    .filter((req) => {
      const matchesSearch =
        req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.client.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.client.full_name &&
          req.client.full_name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" || req.status === statusFilter;

      // Advanced Filters
      const fee = req.unlock_fee;
      const minF = minFee ? parseFloat(minFee) : 0;
      const maxF = maxFee ? parseFloat(maxFee) : Infinity;
      const matchesFee = fee >= minF && fee <= maxF;

      const unlocks = req.total_unlocks;
      const minU = minUnlocks ? parseInt(minUnlocks, 10) : 0;
      const maxU = maxUnlocks ? parseInt(maxUnlocks, 10) : Infinity;
      const matchesUnlocks = unlocks >= minU && unlocks <= maxU;

      return matchesSearch && matchesStatus && matchesFee && matchesUnlocks;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "fee_desc":
          return b.unlock_fee - a.unlock_fee;
        case "unlocks_desc":
          return b.total_unlocks - a.total_unlocks;
        case "recent":
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

  const refreshRequests = async () => {
    try {
      const res = await fetch("/api/admin/requests", {
        credentials: "include",
      });
      if (res.ok) {
        const json = await res.json();
        setRequests(json.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRevealClient = async () => {
    if (!selectedRequest) return;
    setIsRevealing(true);
    try {
      const res = await fetch(
        `/api/admin/requests/${selectedRequest.id}/reveal-client`,
        { method: "POST" },
      );
      if (res.ok) {
        setIsClientRevealed(true);
      } else {
        await error("Failed to log reveal action");
      }
    } catch (e) {
      await error("Network error occurred");
    } finally {
      setIsRevealing(false);
    }
  };

  const handleModerate = async () => {
    if (!selectedRequest) return;

    setIsProcessing(true);
    try {
      const res = await fetch(
        `/api/admin/requests/${selectedRequest.id}/moderate`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: moderationAction === "approve" ? "published" : "cancelled",
            reason: moderationReason || "Moderated by admin",
          }),
        },
      );

      if (res.ok) {
        setIsModerateOpen(false);
        setSelectedRequest(null);
        setModerationReason("");
        await refreshRequests();
        await success(
          `Request ${moderationAction === "approve" ? "approved" : "rejected"} successfully`,
        );
      } else {
        const errorData = await res.json();
        await error(
          errorData.error?.message || errorData.message || "Moderation failed",
        );
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
          <p className="text-xs text-muted-foreground mt-0.5">
            Showing{" "}
            <span className="font-medium text-foreground">
              {filteredRequests.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">
              {initialTotal.toLocaleString()}
            </span>{" "}
            requests
          </p>
        </div>

        {initialRequests.length >= 100 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <span className="font-semibold">⚠</span>
            Results are limited to 100 records. Use search and filters to narrow
            down.
          </div>
        )}

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-3 items-center mb-6">
          <div className="relative w-full max-w-sm">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4.5" />
            <Input
              placeholder="Search by title, client name, or email..."
              className="pl-9 bg-card shadow-sm border-border/50 focus-visible:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-fit bg-card shadow-sm border-border/50 shrink-0">
                <div className="flex items-center gap-2">
                  <FunnelIcon className="size-4 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-fit bg-card shadow-sm border-border/50 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                    Sort by
                  </span>
                  <SelectValue placeholder="Sort..." />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent Setup</SelectItem>
                <SelectItem value="fee_desc">Highest Fee</SelectItem>
                <SelectItem value="unlocks_desc">Most Unlocks</SelectItem>
              </SelectContent>
            </Select>

            {/* Popover Advanced Filters */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={
                    minFee || maxFee
                      ? "bg-primary/5 border-primary/20 text-primary shrink-0"
                      : "bg-card shadow-sm border-border/50 shrink-0 text-muted-foreground"
                  }
                >
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Fee Range
                  </span>
                  {(minFee || maxFee) && (
                    <Badge
                      variant="secondary"
                      className="ml-2 px-1 text-[10px] h-4"
                    >
                      Active
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4" align="start">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Unlock Fee (EGP)</h4>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minFee}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (
                          val &&
                          maxFee &&
                          parseFloat(val) > parseFloat(maxFee)
                        ) {
                          setMinFee(maxFee);
                        } else {
                          setMinFee(val);
                        }
                      }}
                      className="h-8 w-24"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxFee}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (
                          val &&
                          minFee &&
                          parseFloat(val) < parseFloat(minFee)
                        ) {
                          setMaxFee(minFee);
                        } else {
                          setMaxFee(val);
                        }
                      }}
                      className="h-8 w-24"
                    />
                  </div>
                  {(minFee || maxFee) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs h-8"
                      onClick={() => {
                        setMinFee("");
                        setMaxFee("");
                      }}
                    >
                      Clear Fee Filter
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={
                    minUnlocks || maxUnlocks
                      ? "bg-primary/5 border-primary/20 text-primary shrink-0"
                      : "bg-card shadow-sm border-border/50 shrink-0 text-muted-foreground"
                  }
                >
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Unlocks
                  </span>
                  {(minUnlocks || maxUnlocks) && (
                    <Badge
                      variant="secondary"
                      className="ml-2 px-1 text-[10px] h-4"
                    >
                      Active
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4" align="start">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Total Unlocks</h4>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minUnlocks}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (
                          val &&
                          maxUnlocks &&
                          parseInt(val, 10) > parseInt(maxUnlocks, 10)
                        ) {
                          setMinUnlocks(maxUnlocks);
                        } else {
                          setMinUnlocks(val);
                        }
                      }}
                      className="h-8 w-24"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxUnlocks}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (
                          val &&
                          minUnlocks &&
                          parseInt(val, 10) < parseInt(minUnlocks, 10)
                        ) {
                          setMaxUnlocks(minUnlocks);
                        } else {
                          setMaxUnlocks(val);
                        }
                      }}
                      className="h-8 w-24"
                    />
                  </div>
                  {(minUnlocks || maxUnlocks) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs h-8"
                      onClick={() => {
                        setMinUnlocks("");
                        setMaxUnlocks("");
                      }}
                    >
                      Clear Unlocks Filter
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {(minFee || maxFee || minUnlocks || maxUnlocks) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setMinFee("");
                  setMaxFee("");
                  setMinUnlocks("");
                  setMaxUnlocks("");
                }}
                className="text-xs shrink-0 text-muted-foreground hover:text-foreground"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="rounded-xl border bg-card shadow-sm p-12 text-center flex flex-col items-center justify-center text-muted-foreground">
            <div className="size-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <ClockIcon className="size-6" />
            </div>
            <h3 className="text-lg font-medium text-foreground">
              No requests found
            </h3>
            <p className="text-sm mt-1">
              There are no service requests matching your criteria.
            </p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 mt-6 rounded-xl border border-dashed text-center animate-in fade-in">
            <MagnifyingGlassIcon className="size-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No matches found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Try adjusting your search query or filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                onClick={() => setSelectedRequest(request)}
                className="relative flex flex-col justify-between rounded-xl border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors border-transparent truncate max-w-[140px]"
                    >
                      <TagIcon className="mr-1.5 size-3.5 shrink-0" />
                      <span className="truncate">{request.category.name}</span>
                    </Badge>
                    {getStatusBadge(request.status)}
                  </div>

                  <div>
                    <h3 className="font-semibold text-base line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                      {request.title}
                    </h3>
                    <div className="flex flex-col gap-1 mt-3 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <span className="font-medium text-foreground truncate mr-1.5">
                          {request.client.full_name || "Anonymous"}
                        </span>
                        <span className="truncate opacity-70">
                          ({request.client.email})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t flex flex-col gap-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <CalendarIcon className="size-4 shrink-0" />
                      <span className="truncate">
                        {format(new Date(request.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <CurrencyDollarIcon className="size-4 shrink-0" />
                      <span className="font-medium text-foreground whitespace-nowrap">
                        {request.unlock_fee.toFixed(0)} EGP
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1.5 text-xs bg-muted/50 px-2 py-1 rounded-md">
                      <UsersIcon className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium">
                        {request.total_unlocks}
                      </span>
                      <span className="text-muted-foreground">unlocks</span>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 text-xs bg-muted/60 hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRequest(request);
                        setIsModerateOpen(true);
                      }}
                    >
                      <ShieldWarningIcon className="mr-1.5 size-3.5 shrink-0" />
                      Moderate
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Request Detail Dialog */}
        <Dialog
          open={!!selectedRequest && !isModerateOpen}
          onOpenChange={(open) => !open && setSelectedRequest(null)}
        >
          <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-[800px] overflow-y-auto max-h-[90dvh]">
            <DialogHeader>
              <DialogTitle>{selectedRequest?.title}</DialogTitle>
              <DialogDescription>
                Request details and information
              </DialogDescription>
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
                  <div className="px-4 py-2.5 border-b flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Client Details</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => {
                        if (isClientRevealed) {
                          setIsClientRevealed(false);
                        } else {
                          handleRevealClient();
                        }
                      }}
                      disabled={isRevealing}
                    >
                      {isRevealing ? (
                        <>
                          <ClockIcon className="mr-2 size-3.5 animate-spin" />
                          Revealing...
                        </>
                      ) : isClientRevealed ? (
                        <>
                          <EyeClosed className="mr-2 size-3.5" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 size-3.5" />
                          Reveal Details
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Name
                      </span>
                      <span
                        className={
                          isClientRevealed
                            ? "font-medium"
                            : "font-medium filter blur-sm select-none opacity-50 transition-all duration-300"
                        }
                      >
                        {isClientRevealed
                          ? selectedRequest.client.full_name || "Anonymous"
                          : "Jane Doe"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Email
                      </span>
                      <span
                        className={
                          isClientRevealed
                            ? "font-medium"
                            : "font-medium filter blur-sm select-none opacity-50 transition-all duration-300"
                        }
                      >
                        {isClientRevealed
                          ? selectedRequest.client.email
                          : "hidden@example.com"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Phone
                      </span>
                      <span
                        className={
                          isClientRevealed
                            ? "font-medium"
                            : "font-medium filter blur-sm select-none opacity-50 transition-all duration-300"
                        }
                      >
                        {isClientRevealed
                          ? selectedRequest.client.phone || "Not provided"
                          : "+1234567890"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Member Since
                      </span>
                      <span
                        className={
                          isClientRevealed
                            ? "font-medium"
                            : "font-medium filter blur-sm select-none opacity-50 transition-all duration-300"
                        }
                      >
                        {isClientRevealed
                          ? selectedRequest.client.created_at
                            ? format(
                                new Date(selectedRequest.client.created_at),
                                "MMM d, yyyy",
                              )
                            : "N/A"
                          : "Jan 1, 2024"}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        User ID
                      </span>
                      <code
                        className={
                          isClientRevealed
                            ? "text-[10px] bg-muted px-2 py-1 rounded block font-mono break-all"
                            : "text-[10px] bg-muted px-2 py-1 rounded block font-mono break-all filter blur-sm select-none opacity-50 transition-all duration-300"
                        }
                      >
                        {isClientRevealed
                          ? selectedRequest.client.id || "N/A"
                          : "00000000-0000-0000-0000-000000000000"}
                      </code>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border bg-card">
                  <div className="px-4 py-2.5 border-b">
                    <h4 className="text-sm font-semibold">Request Details</h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 text-sm">
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
                                "MMM d, yyyy",
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
                          "MMM d, yyyy",
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Total Unlocks
                      </span>
                      <span className="font-medium">
                        {selectedRequest.total_unlocks} provider(s)
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Unlock Fee
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium font-mono">
                          {selectedRequest.unlock_fee.toFixed(2)} EGP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border bg-card mt-5">
                  <div className="px-4 py-2.5 border-b flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Provider Unlocks</h4>
                    <Badge variant="secondary" className="font-mono">
                      {selectedRequest.unlocks?.length ??
                        selectedRequest.total_unlocks ??
                        0}
                    </Badge>
                  </div>
                  <div className="divide-y text-sm">
                    {!selectedRequest.unlocks ? (
                      <div className="p-8 text-center text-muted-foreground text-xs leading-relaxed">
                        Data not loaded.
                        <br />
                        Please refresh the page to view provider unlock details.
                      </div>
                    ) : selectedRequest.unlocks.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground text-xs">
                        No providers have unlocked this request yet.
                      </div>
                    ) : (
                      selectedRequest.unlocks.map((u) => (
                        <div
                          key={u.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div>
                            <span className="font-medium text-foreground block">
                              {u.provider.user.email}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              Provider ID: {u.provider.user_id}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                            <ClockIcon className="size-3.5" />
                            {format(
                              new Date(u.unlocked_at),
                              "MMM d, yyyy h:mm a",
                            )}
                          </div>
                        </div>
                      ))
                    )}
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
                    variant={
                      moderationAction === "approve" ? "default" : "outline"
                    }
                    className="flex-1"
                    onClick={() => setModerationAction("approve")}
                  >
                    <CheckCircleIcon className="mr-2 size-4" />
                    Approve
                  </Button>
                  <Button
                    variant={
                      moderationAction === "reject" ? "destructive" : "outline"
                    }
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
