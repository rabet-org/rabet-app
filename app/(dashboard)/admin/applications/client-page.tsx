"use client";

import { useState, useEffect } from "react";
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
import { EyeIcon, CheckCircleIcon, XCircleIcon } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type Application = {
  id: string;
  provider_type: string;
  business_name: string | null;
  application_status: "pending" | "approved" | "rejected";
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

  // Function to refresh the list without triggering a full page reload
  const refreshList = async () => {
    try {
      const res = await fetch("/api/admin/provider-applications");
      const json = await res.json();
      if (res.ok) setApps(json.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/provider-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          rejection_reason:
            action === "reject" ? "Did not meet criteria." : undefined,
        }),
      });

      if (res.ok) {
        setSelectedApp(null);
        await refreshList(); // Optimistically refresh data
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
          <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border-emerald-500/20">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-rose-500/15 text-rose-500 hover:bg-rose-500/25 border-rose-500/20">
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 border-amber-500/20">
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50/50 dark:bg-background">
      <Topbar title="Provider Applications" />
      <main className="flex-1 p-6 w-full max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Provider Onboarding
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Review and manage incoming provider applications.
          </p>
        </div>

        <div className="rounded-xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
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
                    className="h-24 text-center text-muted-foreground"
                  >
                    No applications found.
                  </TableCell>
                </TableRow>
              ) : (
                apps.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="font-medium">
                        {app.applicant?.full_name || "N/A"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {app.applicant?.email}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">
                      {app.provider_type}
                    </TableCell>
                    <TableCell>{app.business_name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(app.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(app.application_status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedApp(app)}
                      >
                        <EyeIcon className="mr-2" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog
          open={!!selectedApp}
          onOpenChange={(open) => !open && setSelectedApp(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Review Application</DialogTitle>
              <DialogDescription>
                Detailed information for {selectedApp?.applicant?.full_name}.
              </DialogDescription>
            </DialogHeader>

            {selectedApp && (
              <div className="space-y-4 py-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground block mb-1">
                      Email
                    </span>
                    <span className="font-medium">
                      {selectedApp.applicant?.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">
                      Type
                    </span>
                    <span className="font-medium capitalize">
                      {selectedApp.provider_type}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">
                      Business Name
                    </span>
                    <span className="font-medium">
                      {selectedApp.business_name || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">
                      Submitted At
                    </span>
                    <span className="font-medium">
                      {format(new Date(selectedApp.created_at), "PPp")}
                    </span>
                  </div>
                </div>

                {selectedApp.application_status === "pending" && (
                  <div className="flex gap-3 pt-6 border-t mt-6">
                    <Button
                      variant="default"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white w-full"
                      disabled={isUpdating}
                      onClick={() => handleAction(selectedApp.id, "approve")}
                    >
                      <CheckCircleIcon className="mr-2 size-4" /> Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      disabled={isUpdating}
                      onClick={() => handleAction(selectedApp.id, "reject")}
                    >
                      <XCircleIcon className="mr-2 size-4" /> Reject
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
