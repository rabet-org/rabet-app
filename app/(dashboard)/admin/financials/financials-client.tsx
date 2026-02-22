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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  CurrencyDollar,
  Bank,
  ArrowsLeftRight,
  MagnifyingGlass,
  PlusCircle,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import { useAlertHelpers } from "@/components/ui/alert-toast";

type Transaction = {
  id: string;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string | null;
  created_at: string;
  provider: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
  };
};

type ProviderBalance = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  balance: number;
  currency: string;
};

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

type FinancialData = {
  stats: {
    totalRevenue: number;
    liabilities: number;
    transactionCount: number;
  };
  transactions: Transaction[];
  providers: ProviderBalance[];
  refundableUnlocks: RefundableUnlock[];
};

export default function FinancialsClient({
  initialData,
}: {
  initialData: FinancialData;
}) {
  const [data, setData] = useState(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  const [adjustmentProviderId, setAdjustmentProviderId] = useState("");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [providerSearch, setProviderSearch] = useState("");
  const [isProviderOpen, setIsProviderOpen] = useState(false);

  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Refund state
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

  const filteredTransactions = data.transactions.filter(
    (t) =>
      t.provider.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.provider.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAdjustBalance = async () => {
    if (!adjustmentProviderId || !adjustmentAmount || !adjustmentReason) {
      return error("Please fill in all fields");
    }

    const amountNum = parseFloat(adjustmentAmount);
    if (isNaN(amountNum) || amountNum === 0) {
      return error("Amount must be a non-zero number");
    }

    setIsAdjusting(true);
    try {
      const res = await fetch(
        `/api/admin/providers/${adjustmentProviderId}/wallet/adjust`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amountNum,
            reason: adjustmentReason,
          }),
        },
      );

      if (res.ok) {
        await success("Wallet adjusted successfully");
        setIsAdjustmentModalOpen(false);
        setAdjustmentAmount("");
        setAdjustmentReason("");
        setProviderSearch("");
        setIsProviderOpen(false);
        setAdjustmentProviderId("");
        window.location.reload();
      } else {
        const err = await res.json();
        error(err.message || "Failed to adjust wallet");
      }
    } catch (e) {
      error("Network error");
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleRowClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailModalOpen(true);
  };

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

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50/50 dark:bg-background">
      <Topbar title="Financials Management" />
      <main className="flex-1 p-6 w-full max-w-7xl mx-auto space-y-8 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Platform Economics
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Track revenue, monitor provider wallets, and handle manual
              adjustments.
            </p>
          </div>

          <Dialog
            open={isAdjustmentModalOpen}
            onOpenChange={setIsAdjustmentModalOpen}
          >
            <DialogTrigger asChild>
              <Button className="shrink-0 shadow-sm">
                <PlusCircle className="mr-2 size-4.5" />
                Manual Adjustment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Wallet Adjustment</DialogTitle>
                <DialogDescription>
                  Forcefully credit or debit a provider&apos;s balance. This
                  will be logged permanently.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Provider</label>
                  <div className="relative">
                    <Input
                      placeholder="Search by name or email..."
                      value={providerSearch}
                      onChange={(e) => {
                        setProviderSearch(e.target.value);
                        setAdjustmentProviderId("");
                        setIsProviderOpen(true);
                      }}
                      onFocus={() => setIsProviderOpen(true)}
                      onBlur={() =>
                        setTimeout(() => setIsProviderOpen(false), 150)
                      }
                      autoComplete="off"
                    />
                    {isProviderOpen && (
                      <ul className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md overflow-hidden max-h-56 overflow-y-auto py-1">
                        {data.providers
                          .filter(
                            (p) =>
                              !providerSearch ||
                              p.name
                                .toLowerCase()
                                .includes(providerSearch.toLowerCase()) ||
                              p.email
                                .toLowerCase()
                                .includes(providerSearch.toLowerCase()),
                          )
                          .map((p) => (
                            <li
                              key={p.id}
                              onMouseDown={() => {
                                setAdjustmentProviderId(p.id);
                                setProviderSearch(p.name);
                                setIsProviderOpen(false);
                              }}
                              className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                            >
                              <div className="size-7 rounded-full bg-neutral-200 dark:bg-neutral-800 shrink-0 flex items-center justify-center text-[10px] font-bold uppercase text-muted-foreground overflow-hidden border border-border/40">
                                {p.avatar_url ? (
                                  <img
                                    src={p.avatar_url}
                                    alt={p.name}
                                    className="size-full object-cover"
                                  />
                                ) : (
                                  p.name.charAt(0)
                                )}
                              </div>
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="font-medium truncate">
                                  {p.name}
                                </span>
                                <span className="text-[11px] text-muted-foreground font-mono truncate">
                                  {p.email}
                                </span>
                              </div>
                              <span className="text-xs tabular-nums shrink-0 text-muted-foreground">
                                {p.balance} {p.currency}
                              </span>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount (EGP)</label>
                  <Input
                    type="number"
                    placeholder="e.g. 100 or -50"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Positive for credit, negative for debit.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Reason for Audit
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Refund for failed lead unlock",
                      "Promotional credit",
                      "Balance correction",
                      "Compensation for technical issue",
                      "Withdrawal fee adjustment",
                    ].map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setAdjustmentReason(reason)}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                          adjustmentReason === reason
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                  <Textarea
                    placeholder="Or type a custom reason..."
                    rows={2}
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAdjustBalance}
                  disabled={isAdjusting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isAdjusting ? "Processing..." : "Apply Adjustment"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-sm border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <CurrencyDollar className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.stats.totalRevenue.toLocaleString()} EGP
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Gross earnings from lead unlocks
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Platform Liabilities
              </CardTitle>
              <Bank className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.stats.liabilities.toLocaleString()} EGP
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total balances held in provider wallets
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Recent Activity
              </CardTitle>
              <ArrowsLeftRight className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.stats.transactionCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Transactions recorded in this window
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History Section */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              Ledger Transactions
              <Badge variant="outline" className="font-mono text-[10px]">
                {filteredTransactions.length}
              </Badge>
            </h3>

            <div className="relative w-full max-w-sm">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4.5" />
              <Input
                placeholder="Search transactions..."
                className="pl-9 bg-card shadow-sm border-border/50 focus-visible:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Balance Change</TableHead>
                    <TableHead className="min-w-[200px]">Description</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-32 text-center text-muted-foreground"
                      >
                        No transactions match your search criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((t) => (
                      <TableRow
                        key={t.id}
                        onClick={() => handleRowClick(t)}
                        className="hover:bg-muted/10 transition-colors cursor-pointer group"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-full bg-neutral-200 dark:bg-neutral-800 shrink-0 overflow-hidden border border-border/40">
                              {t.provider.avatar_url ? (
                                <img
                                  src={t.provider.avatar_url}
                                  alt={t.provider.full_name}
                                  className="size-full object-cover"
                                />
                              ) : (
                                <div className="size-full flex items-center justify-center text-xs font-bold text-muted-foreground uppercase">
                                  {t.provider.full_name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="text-sm font-medium truncate">
                                {t.provider.full_name}
                              </div>
                              <div className="text-[11px] text-muted-foreground font-mono truncate">
                                {t.provider.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`uppercase text-[9px] font-bold tracking-wider px-1.5 ${
                              t.type === "deposit"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : t.type === "debit"
                                  ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                  : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            }`}
                          >
                            {t.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`${t.type === "deposit" ? "text-emerald-600" : "text-rose-600"} font-bold tabular-nums`}
                          >
                            {t.type === "deposit" ? "+" : "-"}
                            {t.amount.toLocaleString()} EGP
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                            <span>{t.balance_before.toLocaleString()}</span>
                            <ArrowsLeftRight className="size-3 text-border" />
                            <span className="text-foreground font-medium">
                              {t.balance_after.toLocaleString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-balance max-w-md italic">
                            {t.description || "—"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm whitespace-nowrap">
                            {format(new Date(t.created_at), "MMM d, yyyy")}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {format(new Date(t.created_at), "h:mm a")}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Refund Management Section */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ArrowCounterClockwise className="size-5 text-amber-500" />
              Refund Management
              <Badge variant="outline" className="font-mono text-[10px]">
                {
                  refundableUnlocks.filter(
                    (u) =>
                      !refundSearch ||
                      u.provider.full_name
                        .toLowerCase()
                        .includes(refundSearch.toLowerCase()) ||
                      u.provider.email
                        .toLowerCase()
                        .includes(refundSearch.toLowerCase()) ||
                      u.request.title
                        .toLowerCase()
                        .includes(refundSearch.toLowerCase()),
                  ).length
                }
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
                  {refundableUnlocks.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No completed unlocks available for refund.
                      </TableCell>
                    </TableRow>
                  ) : (
                    refundableUnlocks
                      .filter(
                        (u) =>
                          !refundSearch ||
                          u.provider.full_name
                            .toLowerCase()
                            .includes(refundSearch.toLowerCase()) ||
                          u.provider.email
                            .toLowerCase()
                            .includes(refundSearch.toLowerCase()) ||
                          u.request.title
                            .toLowerCase()
                            .includes(refundSearch.toLowerCase()),
                      )
                      .map((unlock) => (
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
                                    onClick={() =>
                                      handleProcessRefund(unlock.id)
                                    }
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

        {/* Transaction Detail Dialog */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Transaction Details
                {selectedTransaction && (
                  <Badge
                    variant="outline"
                    className="text-[10px] py-0 font-mono text-muted-foreground"
                  >
                    {selectedTransaction.id.split("-")[0]}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                Complete audit trail for this wallet movement.
              </DialogDescription>
            </DialogHeader>

            {selectedTransaction && (
              <div className="space-y-6 py-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-neutral-200 dark:bg-neutral-800 shrink-0 overflow-hidden border border-border/40">
                      {selectedTransaction.provider.avatar_url ? (
                        <img
                          src={selectedTransaction.provider.avatar_url}
                          alt={selectedTransaction.provider.full_name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="size-full flex items-center justify-center text-sm font-bold text-muted-foreground uppercase">
                          {selectedTransaction.provider.full_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">
                        {selectedTransaction.provider.full_name}
                      </h4>
                      <p className="text-xs text-muted-foreground font-mono">
                        {selectedTransaction.provider.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant="secondary"
                      className="uppercase text-[9px] mb-1"
                    >
                      {selectedTransaction.type}
                    </Badge>
                    <div
                      className={`text-xl font-bold tabular-nums ${selectedTransaction.type === "deposit" ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {selectedTransaction.type === "deposit" ? "+" : "-"}
                      {selectedTransaction.amount.toLocaleString()} EGP
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1 p-3 rounded-lg border bg-card/30">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Before Balance
                    </p>
                    <p className="font-mono text-lg">
                      {selectedTransaction.balance_before.toLocaleString()} EGP
                    </p>
                  </div>
                  <div className="space-y-1 p-3 rounded-lg border bg-card/30">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      After Balance
                    </p>
                    <p className="font-mono text-lg">
                      {selectedTransaction.balance_after.toLocaleString()} EGP
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    Description / Audit Reason
                  </p>
                  <p className="text-sm p-4 rounded-lg bg-neutral-100 dark:bg-neutral-900 italic border border-border/40 text-balance">
                    {selectedTransaction.description ||
                      "No description provided."}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t pt-4 px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold">Transaction ID:</span>
                    <span className="font-mono">{selectedTransaction.id}</span>
                  </div>
                  <div>
                    {format(
                      new Date(selectedTransaction.created_at),
                      "PPPP 'at' p",
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => setIsDetailModalOpen(false)}>
                Close Details
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
