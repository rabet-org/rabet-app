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
import { ActivityIcon, WalletIcon, ShieldIcon } from "@phosphor-icons/react";

type AdminLog = {
  id: string;
  admin_id: string;
  action_type: string;
  target_id: string;
  details: any;
  created_at: string;
  admin: {
    email: string;
    profile: {
      full_name: string;
    } | null;
  };
};

export default function AdminFinanceClient({
  initialData,
}: {
  initialData: AdminLog[];
}) {
  const [logs] = useState<AdminLog[]>(initialData);

  const getActionIcon = (type: string) => {
    if (type.includes("wallet") || type.includes("transaction"))
      return <WalletIcon className="size-4 text-emerald-500" />;
    if (type.includes("status_change") || type.includes("ban"))
      return <ShieldIcon className="size-4 text-rose-500" />;
    return <ActivityIcon className="size-4 text-blue-500" />;
  };

  const formatActionName = (type: string) => {
    return type
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50/50 dark:bg-background">
      <Topbar title="Finance & Platform Audit" />
      <main className="flex-1 p-6 w-full max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            System Audit Logs
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Immutable ledger of platform events, transactions, and
            administrative actions.
          </p>
        </div>

        <div className="rounded-xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Administrator</TableHead>
                <TableHead>Target Entity</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No logs found.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {format(new Date(log.created_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action_type)}
                        <span className="font-medium">
                          {formatActionName(log.action_type)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.admin.profile?.full_name}{" "}
                      <span className="text-xs text-muted-foreground block">
                        {log.admin.email}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.target_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
