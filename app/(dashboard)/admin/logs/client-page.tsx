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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  WalletIcon,
  ShieldWarningIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClipboardTextIcon,
  StarIcon,
  CurrencyDollarIcon,
  LockKeyIcon,
} from "@phosphor-icons/react";

type AdminLog = {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  details: Record<string, any> | null;
  created_at: string;
  admin: {
    id: string;
    email: string;
    full_name: string;
  };
};

const ACTION_META: Record<
  string,
  { color: string; badgeClass: string; Icon: any; label: string }
> = {
  approve_provider: {
    color: "emerald",
    badgeClass:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    Icon: CheckCircleIcon,
    label: "Provider Approved",
  },
  reject_provider: {
    color: "rose",
    badgeClass:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    Icon: XCircleIcon,
    label: "Provider Rejected",
  },
  verify_provider: {
    color: "blue",
    badgeClass:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    Icon: ShieldCheckIcon,
    label: "Provider Verified",
  },
  unverify_provider: {
    color: "amber",
    badgeClass:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    Icon: ShieldWarningIcon,
    label: "Provider Unverified",
  },
  moderate_request: {
    color: "purple",
    badgeClass:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    Icon: LockKeyIcon,
    label: "Request Moderated",
  },
  remove_review: {
    color: "rose",
    badgeClass:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    Icon: StarIcon,
    label: "Review Removed",
  },
  process_refund: {
    color: "emerald",
    badgeClass:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    Icon: CurrencyDollarIcon,
    label: "Refund Processed",
  },
  block_user: {
    color: "rose",
    badgeClass:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    Icon: ShieldWarningIcon,
    label: "User Blocked",
  },
  unblock_user: {
    color: "emerald",
    badgeClass:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    Icon: ShieldCheckIcon,
    label: "User Unblocked",
  },
  adjust_wallet: {
    color: "blue",
    badgeClass:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    Icon: WalletIcon,
    label: "Wallet Adjusted",
  },
};

function getActionMeta(type: string) {
  return (
    ACTION_META[type] ?? {
      color: "gray",
      badgeClass: "bg-muted text-muted-foreground border-border",
      Icon: ClipboardTextIcon,
      label: type
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
    }
  );
}

export default function AdminFinanceClient({
  initialData,
}: {
  initialData: AdminLog[];
}) {
  const [logs] = useState<AdminLog[]>(initialData);
  const [selectedLog, setSelectedLog] = useState<AdminLog | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50/50 dark:bg-background">
      <Topbar title="Audit Logs" />
      <main className="flex-1 p-6 w-full max-w-7xl mx-auto space-y-6 pb-16">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            System Audit Logs
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Immutable ledger of all administrative actions on the platform.
          </p>
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[170px]">Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Performed By</TableHead>
                  <TableHead>Target Type</TableHead>
                  <TableHead>Target ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No audit logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const meta = getActionMeta(log.action_type);
                    const Icon = meta.Icon;
                    return (
                      <TableRow
                        key={log.id}
                        className="group cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => setSelectedLog(log)}
                      >
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          <div>
                            {format(new Date(log.created_at), "MMM d, yyyy")}
                          </div>
                          <div className="text-xs">
                            {format(new Date(log.created_at), "HH:mm:ss")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`gap-1.5 ${meta.badgeClass}`}
                          >
                            <Icon className="size-3" />
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                              {log.admin.full_name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-medium">
                                {log.admin.full_name}
                              </div>
                              <div className="text-xs text-muted-foreground font-mono">
                                {log.admin.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize text-sm text-muted-foreground">
                            {log.target_type}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {log.target_id.slice(0, 8)}…
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Detail Dialog */}
        <Dialog
          open={!!selectedLog}
          onOpenChange={(o) => !o && setSelectedLog(null)}
        >
          <DialogContent className="max-w-lg overflow-y-auto max-h-[90dvh]">
            <DialogHeader>
              <DialogTitle>Audit Log Detail</DialogTitle>
            </DialogHeader>

            {selectedLog &&
              (() => {
                const meta = getActionMeta(selectedLog.action_type);
                const Icon = meta.Icon;
                return (
                  <div className="space-y-5 pb-1">
                    {/* Action header */}
                    <div className="flex items-center gap-3 p-4 rounded-xl border bg-muted/40">
                      <div
                        className={`size-12 rounded-xl flex items-center justify-center bg-${meta.color}-500/10`}
                      >
                        <Icon className={`size-6 text-${meta.color}-500`} />
                      </div>
                      <div>
                        <p className="font-semibold text-base">{meta.label}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          {selectedLog.action_type}
                        </p>
                      </div>
                      <div className="ml-auto">
                        <Badge variant="outline" className={meta.badgeClass}>
                          {meta.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Who performed it */}
                    <div className="rounded-xl border bg-card">
                      <div className="px-4 py-2.5 border-b flex items-center gap-2">
                        <UserCircleIcon className="size-4 text-muted-foreground" />
                        <h4 className="text-sm font-semibold">Performed By</h4>
                      </div>
                      <div className="flex items-center gap-3 p-4">
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {selectedLog.admin.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">
                            {selectedLog.admin.full_name}
                          </p>
                          <p className="text-sm text-muted-foreground font-mono">
                            {selectedLog.admin.email}
                          </p>
                        </div>
                        <code className="ml-auto text-[10px] bg-muted px-2 py-1 rounded font-mono text-muted-foreground">
                          {selectedLog.admin.id.slice(0, 12)}…
                        </code>
                      </div>
                    </div>

                    {/* Target */}
                    <div className="rounded-xl border bg-card">
                      <div className="px-4 py-2.5 border-b">
                        <h4 className="text-sm font-semibold">Target Entity</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 text-sm">
                        <div>
                          <span className="text-muted-foreground text-xs block mb-0.5">
                            Entity Type
                          </span>
                          <span className="font-medium capitalize">
                            {selectedLog.target_type}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block mb-0.5">
                            Log ID
                          </span>
                          <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
                            {selectedLog.id.slice(0, 12)}…
                          </code>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground text-xs block mb-0.5">
                            Full Target ID
                          </span>
                          <code className="text-[10px] bg-muted px-2 py-1 rounded block font-mono break-all">
                            {selectedLog.target_id}
                          </code>
                        </div>
                      </div>
                    </div>

                    {/* Details JSON */}
                    {selectedLog.details &&
                      Object.keys(selectedLog.details).length > 0 && (
                        <div className="rounded-xl border bg-card">
                          <div className="px-4 py-2.5 border-b flex items-center gap-2">
                            <ClipboardTextIcon className="size-4 text-muted-foreground" />
                            <h4 className="text-sm font-semibold">
                              Action Details
                            </h4>
                          </div>
                          <div className="p-4 space-y-2">
                            {Object.entries(selectedLog.details).map(
                              ([key, val]) => (
                                <div
                                  key={key}
                                  className="flex items-start justify-between gap-4 text-sm"
                                >
                                  <span className="text-muted-foreground capitalize min-w-0 shrink-0">
                                    {key.replace(/_/g, " ")}
                                  </span>
                                  <span className="font-medium text-right break-all">
                                    {typeof val === "object"
                                      ? JSON.stringify(val)
                                      : String(val ?? "—")}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    {/* Timestamp */}
                    <div className="rounded-xl border bg-card">
                      <div className="px-4 py-2.5 border-b">
                        <h4 className="text-sm font-semibold">Timestamp</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-4 text-sm">
                        <div>
                          <span className="text-muted-foreground text-xs block mb-0.5">
                            Date
                          </span>
                          <span className="font-medium">
                            {format(
                              new Date(selectedLog.created_at),
                              "MMMM d, yyyy",
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block mb-0.5">
                            Time (UTC)
                          </span>
                          <span className="font-medium font-mono">
                            {format(
                              new Date(selectedLog.created_at),
                              "HH:mm:ss",
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
