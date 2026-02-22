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
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowCounterClockwise,
  MagnifyingGlass,
  CurrencyDollar,
  ListChecks,
} from "@phosphor-icons/react";
import { useAlertHelpers } from "@/components/ui/alert-toast";

type RefundableUnlock = {
  id: string;
  unlock_fee: number;
  unlocked_at: string;
  request: {
    id: string;
    title: string;
    category: { name: string };
  };
  provider: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
  };
};

type RefundsData = {
  stats: {
    totalRefundable: number;
    count: number;
    total: number;
  };
  refundableUnlocks: RefundableUnlock[];
};

export default function RefundsClient({
  initialData,
}: {
  initialData: RefundsData;
}) {
  const [refundableUnlocks, setRefundableUnlocks] = useState<
    RefundableUnlock[]
  >(initialData.refundableUnlocks);
  const [refundingUnlockId, setRefundingUnlockId] = useState<string | null>(
    null,
  );
  const [refundReason, setRefundReason] = useState("");
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [refundSearch, setRefundSearch] = useState("");

  const { success, error } = useAlertHelpers();

  const handleProcessRefund = async (unlockId: string) => {
    if (!refundReason.trim()) return error("Please provide a reason");
    setIsProcessingRefund(true);
    try {
      const res = await fetch(`/api/admin/unlocks/${unlockId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: refundReason }),
      });
      if (res.ok) {
        await success("Refund processed successfully");
        setRefundableUnlocks((prev) => prev.filter((u) => u.id !== unlockId));
        setRefundingUnlockId(null);
        setRefundReason("");
      } else {
        const err = await res.json();
        error(err.message || "Failed to process refund");
      }
    } catch {
      error("Network error");
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const filteredUnlocks = refundableUnlocks.filter(
    (u) =>
      !refundSearch ||
      u.provider.full_name.toLowerCase().includes(refundSearch.toLowerCase()) ||
      u.provider.email.toLowerCase().includes(refundSearch.toLowerCase()) ||
      u.request.title.toLowerCase().includes(refundSearch.toLowerCase()),
  );

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50/50 dark:bg-background">
      <Topbar title="Refund Management" />
      <main className="flex-1 p-6 w-full max-w-7xl mx-auto space-y-8 pb-20">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Refund Management
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Review completed lead unlocks and process refunds back to provider
            wallets.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="shadow-sm border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Refundable Amount
              </CardTitle>
              <CurrencyDollar className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {initialData.stats.totalRefundable.toLocaleString()} EGP
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Sum of all completed unlock fees
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Eligible Unlocks
              </CardTitle>
              <ListChecks className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {refundableUnlocks.length}
                {initialData.stats.total > refundableUnlocks.length && (
                  <span className="text-base font-normal text-muted-foreground ml-1">
                    of {initialData.stats.total.toLocaleString()}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Completed unlocks available for refund
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Refunds Table */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ArrowCounterClockwise className="size-5 text-amber-500" />
              Completed Unlocks
              <Badge variant="outline" className="font-mono text-[10px]">
                {filteredUnlocks.length} of{" "}
                {initialData.stats.total.toLocaleString()}
              </Badge>
            </h3>
            <div className="relative w-full max-w-sm">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4.5" />
              <Input
                placeholder="Search by provider or request..."
                className="pl-9 bg-card shadow-sm border-border/50 focus-visible:ring-primary/20"
                value={refundSearch}
                onChange={(e) => setRefundSearch(e.target.value)}
              />
            </div>
          </div>

          {refundableUnlocks.length >= 100 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <span className="font-semibold">⚠</span>
              Results are limited to 100 records. Use search to narrow down.
            </div>
          )}

          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Request</TableHead>
                    <TableHead>Unlock Fee</TableHead>
                    <TableHead>Unlocked At</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUnlocks.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No completed unlocks available for refund.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUnlocks.map((unlock) => (
                      <TableRow key={unlock.id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-neutral-200 dark:bg-neutral-800 shrink-0 overflow-hidden border border-border/40 flex items-center justify-center text-xs font-bold text-muted-foreground uppercase">
                              {unlock.provider.avatar_url ? (
                                <img
                                  src={unlock.provider.avatar_url}
                                  alt={unlock.provider.full_name}
                                  className="size-full object-cover"
                                />
                              ) : (
                                unlock.provider.full_name.charAt(0)
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium truncate">
                                {unlock.provider.full_name}
                              </span>
                              <span className="text-[11px] text-muted-foreground font-mono truncate">
                                {unlock.provider.email}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium truncate max-w-[220px]">
                            {unlock.request.title}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {unlock.request.category.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold tabular-nums text-amber-600">
                            {unlock.unlock_fee.toLocaleString()} EGP
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm whitespace-nowrap">
                            {format(
                              new Date(unlock.unlocked_at),
                              "MMM d, yyyy",
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {format(new Date(unlock.unlocked_at), "h:mm a")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right align-top">
                          {refundingUnlockId === unlock.id ? (
                            <div className="space-y-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-left min-w-[280px]">
                              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                                Reason for refund
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {[
                                  "Provider request",
                                  "Failed service delivery",
                                  "Duplicate unlock",
                                  "Technical error",
                                ].map((r) => (
                                  <button
                                    key={r}
                                    type="button"
                                    onClick={() => setRefundReason(r)}
                                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                                      refundReason === r
                                        ? "bg-amber-500 text-white border-amber-500"
                                        : "bg-muted/50 text-muted-foreground border-border hover:border-amber-500/50"
                                    }`}
                                  >
                                    {r}
                                  </button>
                                ))}
                              </div>
                              <Textarea
                                placeholder="Or type a custom reason..."
                                rows={2}
                                value={refundReason}
                                onChange={(e) =>
                                  setRefundReason(e.target.value)
                                }
                                className="text-xs"
                              />
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-xs"
                                  onClick={() => {
                                    setRefundingUnlockId(null);
                                    setRefundReason("");
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  className="flex-1 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                                  disabled={
                                    isProcessingRefund || !refundReason.trim()
                                  }
                                  onClick={() => handleProcessRefund(unlock.id)}
                                >
                                  {isProcessingRefund
                                    ? "Processing..."
                                    : "Confirm Refund"}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs border-amber-500/40 text-amber-600 hover:bg-amber-500/10"
                              onClick={() => {
                                setRefundingUnlockId(unlock.id);
                                setRefundReason("");
                              }}
                            >
                              <ArrowCounterClockwise className="mr-1.5 size-3.5" />
                              Process Refund
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
