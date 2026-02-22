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
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  LinkIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingsIcon,
  CalendarIcon,
  InfoIcon,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  };
};

export default function AdminApplicationsClient({
  initialData,
}: {
  initialData: Application[];
}) {
  const [apps, setApps] = useState<Application[]>(initialData);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

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

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setIsUpdating(true);
    try {
      const endpoint = `/api/admin/provider-applications/${id}/${action}`;
      const body =
        action === "reject"
          ? { rejection_reason: "Did not meet criteria." }
          : {};

      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSelectedApp(null);
        await refreshList();
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Action failed");
      }
    } catch (e) {
      alert("Network error occurred.");
    } finally {
      setIsUpdating(false);
    }
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

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[280px]">Applicant</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No applications found.
                    </TableCell>
                  </TableRow>
                ) : (
                  apps.map((app) => (
                    <TableRow
                      key={app.id}
                      className="group hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedApp(app)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                            {app.applicant?.full_name
                              ?.charAt(0)
                              .toUpperCase() ||
                              app.applicant?.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium group-hover:text-primary transition-colors">
                              {app.applicant?.full_name || "N/A"}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {app.applicant?.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {app.provider_type}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
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
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApp(app);
                          }}
                        >
                          <EyeIcon className="mr-1.5 size-4" /> Review
                        </Button>
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
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 text-sm">
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
                    <div className="col-span-2">
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Portfolio / Website
                      </span>
                      {selectedApp.portfolio_url ? (
                        <a
                          href={selectedApp.portfolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 font-medium"
                        >
                          <LinkIcon className="size-3.5" />
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
      </main>
    </div>
  );
}
