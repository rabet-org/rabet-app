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
  CheckCircleIcon,
  XCircleIcon,
  LinkIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingsIcon,
  CalendarIcon,
  InfoIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ListDashesIcon,
  TagIcon,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAlertHelpers } from "@/components/ui/alert-toast";

type Application = {
  id: string;
  provider_type: string;
  business_name: string | null;
  description: string;
  portfolio_url: string | null;
  application_status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
  applicant: {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
  };
  services?: { id: string; name: string; icon: string | null }[];
};

export default function AdminApplicationsClient({
  initialData,
}: {
  initialData: Application[];
}) {
  const [apps, setApps] = useState<Application[]>(initialData);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { success, error } = useAlertHelpers();

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkRejectOpen, setIsBulkRejectOpen] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");
  const [bulkProgress, setBulkProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const refreshList = async () => {
    try {
      const res = await fetch("/api/admin/provider-applications", {
        credentials: "include",
      });
      const json = await res.json();
      if (res.ok) setApps(json.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAction = async (
    id: string,
    action: "approve" | "reject",
    rejectionReason = "Did not meet criteria.",
  ) => {
    setIsUpdating(true);
    try {
      const endpoint = `/api/admin/provider-applications/${id}/${action}`;
      const body =
        action === "reject" ? { rejection_reason: rejectionReason } : {};

      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSelectedApp(null);
        await refreshList();
        await success(
          `Application ${
            action === "approve" ? "approved" : "rejected"
          } successfully`,
        );
      } else {
        const errorData = await res.json();
        await error(errorData.message || "Action failed");
      }
    } catch {
      await error("Network error occurred.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkProcess = async (
    action: "approve" | "reject",
    rejectionReason = "",
  ) => {
    const ids = Array.from(selectedIds);
    setIsBulkProcessing(true);
    setBulkProgress({ done: 0, total: ids.length });
    let doneCount = 0;
    for (const id of ids) {
      try {
        const endpoint = `/api/admin/provider-applications/${id}/${action}`;
        const body =
          action === "reject" ? { rejection_reason: rejectionReason } : {};
        await fetch(endpoint, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch {
        // continue despite individual failures
      }
      doneCount++;
      setBulkProgress({ done: doneCount, total: ids.length });
    }
    await refreshList();
    setSelectedIds(new Set());
    setIsBulkRejectOpen(false);
    setBulkRejectReason("");
    setBulkProgress(null);
    setIsBulkProcessing(false);
    await success(
      `${doneCount} application${doneCount !== 1 ? "s" : ""} ${
        action === "approve" ? "approved" : "rejected"
      }`,
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          >
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
          >
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
          >
            Pending Review
          </Badge>
        );
    }
  };

  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      searchQuery === "" ||
      app.applicant?.full_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      app.applicant?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.business_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || app.application_status === statusFilter;

    const matchesType =
      typeFilter === "all" || app.provider_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50/50 dark:bg-background">
      <Topbar title="Provider Applications" />
      <main className="flex-1 p-6 w-full max-w-7xl mx-auto space-y-6 overflow-y-auto pb-20">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Provider Onboarding
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Review and manage incoming provider applications.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4.5" />
            <Input
              placeholder="Search applicant or business name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card shadow-sm"
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-card shadow-sm">
                <div className="flex items-center gap-2">
                  <FunnelIcon className="size-4 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px] bg-card shadow-sm">
                <div className="flex items-center gap-2">
                  <ListDashesIcon className="size-4 text-muted-foreground" />
                  <SelectValue placeholder="Type" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="agency">Agency</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk action bar — visible when rows are selected */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5">
            <span className="text-sm font-medium">
              {selectedIds.size} application{selectedIds.size !== 1 ? "s" : ""}{" "}
              selected
            </span>
            {bulkProgress ? (
              <span className="text-sm text-muted-foreground">
                Processing {bulkProgress.done} / {bulkProgress.total}...
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-muted-foreground"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={isBulkProcessing}
                  onClick={() => handleBulkProcess("approve")}
                >
                  <CheckCircleIcon className="mr-1.5 size-4" />
                  Approve Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                  disabled={isBulkProcessing}
                  onClick={() => setIsBulkRejectOpen(true)}
                >
                  <XCircleIcon className="mr-1.5 size-4" />
                  Reject Selected
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden w-full">
          <div className="w-full overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-10 px-4">
                    {(() => {
                      const pendingIds = filteredApps
                        .filter((a) => a.application_status === "pending")
                        .map((a) => a.id);
                      const allSelected =
                        pendingIds.length > 0 &&
                        pendingIds.every((id) => selectedIds.has(id));
                      const someSelected =
                        pendingIds.some((id) => selectedIds.has(id)) &&
                        !allSelected;
                      return (
                        <input
                          type="checkbox"
                          className="size-4 rounded border-border cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-40"
                          checked={allSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someSelected;
                          }}
                          disabled={pendingIds.length === 0}
                          onChange={() => {
                            if (allSelected) {
                              setSelectedIds((prev) => {
                                const next = new Set(prev);
                                pendingIds.forEach((id) => next.delete(id));
                                return next;
                              });
                            } else {
                              setSelectedIds(
                                (prev) => new Set([...prev, ...pendingIds]),
                              );
                            }
                          }}
                          title={
                            pendingIds.length === 0
                              ? "No pending applications in view"
                              : "Select all pending"
                          }
                        />
                      );
                    })()}
                  </TableHead>
                  <TableHead className="w-[30%] min-w-[200px]">
                    Applicant
                  </TableHead>
                  <TableHead className="w-[15%] min-w-[100px]">Type</TableHead>
                  <TableHead className="w-[25%] min-w-[150px]">
                    Business Name
                  </TableHead>
                  <TableHead className="w-[15%] min-w-[120px]">
                    Submitted
                  </TableHead>
                  <TableHead className="w-[15%] min-w-[100px]">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApps.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-muted-foreground"
                    >
                      {apps.length === 0
                        ? "No applications found."
                        : "No applications match your filters."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApps.map((app) => (
                    <TableRow
                      key={app.id}
                      className="group hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedApp(app)}
                    >
                      <TableCell
                        className="px-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {app.application_status === "pending" && (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(app.id)}
                            onChange={() => toggleSelect(app.id)}
                            className="size-4 rounded border-border cursor-pointer accent-primary"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="size-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm overflow-hidden border border-border/50">
                            {app.applicant?.avatar_url ? (
                              <img
                                src={app.applicant.avatar_url}
                                alt="Applicant Avatar"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (
                                app.applicant?.full_name ||
                                app.applicant?.email ||
                                ""
                              )
                                .charAt(0)
                                .toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium group-hover:text-primary transition-colors truncate">
                              {app.applicant?.full_name || "N/A"}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono truncate">
                              {app.applicant?.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {app.provider_type}
                      </TableCell>
                      <TableCell className="text-muted-foreground truncate max-w-[200px]">
                        {app.business_name || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(app.created_at), "MMM d, yyyy")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(app.created_at), "h:mm a")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(app.application_status)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Application Detail Dialog */}
        <Dialog
          open={!!selectedApp}
          onOpenChange={(open) => !open && setSelectedApp(null)}
        >
          <DialogContent className="max-w-lg overflow-y-auto max-h-[90dvh]">
            <DialogHeader>
              <DialogTitle>Application Review</DialogTitle>
            </DialogHeader>

            {selectedApp && (
              <div className="space-y-5 pb-1">
                {/* Applicant Identity */}
                <div className="flex items-center gap-4 p-4 rounded-xl border bg-muted/40">
                  <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl shrink-0">
                    {selectedApp.applicant?.full_name
                      ?.charAt(0)
                      .toUpperCase() ||
                      selectedApp.applicant?.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-lg leading-tight truncate">
                      {selectedApp.applicant?.full_name ||
                        "Anonymous Applicant"}
                    </h3>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5 font-mono truncate">
                      <EnvelopeIcon className="size-3.5 shrink-0" />
                      {selectedApp.applicant?.email}
                    </div>
                    {selectedApp.applicant?.phone && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                        <PhoneIcon className="size-3.5 shrink-0" />
                        {selectedApp.applicant.phone}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      {getStatusBadge(selectedApp.application_status)}
                    </div>
                  </div>
                </div>

                {/* Business Info */}
                <div className="rounded-xl border bg-card">
                  <div className="px-4 py-2.5 border-b flex items-center gap-2">
                    <BuildingsIcon className="size-4 text-muted-foreground" />
                    <h4 className="text-sm font-semibold">
                      Business Information
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4 p-4 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Provider Type
                      </span>
                      <span className="font-medium capitalize">
                        {selectedApp.provider_type}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Business Name
                      </span>
                      <span className="font-medium">
                        {selectedApp.business_name || "Not provided"}
                      </span>
                    </div>

                    {/* Offered Services */}
                    <div className="col-span-2 pt-1">
                      <span className="text-muted-foreground text-xs flex items-center gap-1.5 mb-1.5">
                        <TagIcon className="size-3.5" />
                        Offered Services
                      </span>
                      {selectedApp.services &&
                      selectedApp.services.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedApp.services.map((service) => (
                            <Badge
                              key={service.id}
                              variant="secondary"
                              className="font-normal bg-muted border-transparent"
                            >
                              {service.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">
                          No specific services offered
                        </span>
                      )}
                    </div>

                    <div className="col-span-2 pt-1">
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Portfolio / Website
                      </span>
                      {selectedApp.portfolio_url ? (
                        <a
                          href={selectedApp.portfolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 font-medium break-all"
                        >
                          <LinkIcon className="size-3.5 shrink-0" />
                          {selectedApp.portfolio_url}
                        </a>
                      ) : (
                        <span className="text-muted-foreground italic">
                          No portfolio provided
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedApp.description && (
                  <div className="rounded-xl border bg-card">
                    <div className="px-4 py-2.5 border-b flex items-center gap-2">
                      <InfoIcon className="size-4 text-muted-foreground" />
                      <h4 className="text-sm font-semibold">
                        Application Description
                      </h4>
                    </div>
                    <p className="p-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {selectedApp.description}
                    </p>
                  </div>
                )}

                {/* Timeline */}
                <div className="rounded-xl border bg-card">
                  <div className="px-4 py-2.5 border-b flex items-center gap-2">
                    <CalendarIcon className="size-4 text-muted-foreground" />
                    <h4 className="text-sm font-semibold">Timeline</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Submitted On
                      </span>
                      <span className="font-medium">
                        {format(
                          new Date(selectedApp.created_at),
                          "MMM d, yyyy",
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground block">
                        {format(new Date(selectedApp.created_at), "h:mm a")}
                      </span>
                    </div>
                    {selectedApp.reviewed_at && (
                      <div>
                        <span className="text-muted-foreground text-xs block mb-0.5">
                          Reviewed On
                        </span>
                        <span className="font-medium">
                          {format(
                            new Date(selectedApp.reviewed_at),
                            "MMM d, yyyy",
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground block">
                          {format(new Date(selectedApp.reviewed_at), "h:mm a")}
                        </span>
                      </div>
                    )}
                    <div className="col-span-2">
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Application ID
                      </span>
                      <code className="text-[10px] bg-muted px-2 py-1 rounded block font-mono break-all">
                        {selectedApp.id}
                      </code>
                    </div>
                  </div>
                </div>

                {/* Rejection Reason (if any) */}
                {selectedApp.rejection_reason && (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm">
                    <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1 uppercase tracking-wider">
                      Rejection Reason
                    </p>
                    <p className="text-muted-foreground">
                      {selectedApp.rejection_reason}
                    </p>
                  </div>
                )}

                {/* Action Buttons — only show for pending */}
                {selectedApp.application_status === "pending" && (
                  <div className="flex gap-3 pt-1">
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={isUpdating}
                      onClick={() => handleAction(selectedApp.id, "approve")}
                    >
                      <CheckCircleIcon className="mr-2 size-4" />
                      Approve Application
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/60"
                      disabled={isUpdating}
                      onClick={() => handleAction(selectedApp.id, "reject")}
                    >
                      <XCircleIcon className="mr-2 size-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Bulk Reject Reason Dialog */}
        <Dialog
          open={isBulkRejectOpen}
          onOpenChange={(open) => {
            if (!open) {
              setIsBulkRejectOpen(false);
              setBulkRejectReason("");
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Reject {selectedIds.size} Application
                {selectedIds.size !== 1 ? "s" : ""}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                This reason will be sent to all selected applicants.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Did not meet criteria",
                  "Incomplete application",
                  "Duplicate account",
                  "Service not supported",
                  "Insufficient information",
                ].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setBulkRejectReason(r)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                      bulkRejectReason === r
                        ? "bg-destructive text-destructive-foreground border-destructive"
                        : "bg-muted/50 text-muted-foreground border-border hover:border-destructive/50 hover:text-foreground"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <textarea
                className="w-full min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Or type a custom reason..."
                value={bulkRejectReason}
                onChange={(e) => setBulkRejectReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsBulkRejectOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={!bulkRejectReason.trim() || isBulkProcessing}
                onClick={() =>
                  handleBulkProcess("reject", bulkRejectReason.trim())
                }
              >
                <XCircleIcon className="mr-2 size-4" />
                {isBulkProcessing
                  ? `Processing...`
                  : `Reject ${selectedIds.size}`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
