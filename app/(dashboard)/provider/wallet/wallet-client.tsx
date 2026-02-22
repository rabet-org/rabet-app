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
import { Card } from "@/components/ui/card";
import {
  WalletIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon,
  TrendUpIcon,
  TrendDownIcon,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAlertHelpers } from "@/components/ui/alert-toast";

type Wallet = {
  id: string;
  balance: number;
  currency: string;
  total_deposited: number;
  total_spent: number;
  updated_at: string;
};

type Transaction = {
  id: string;
  type: "deposit" | "debit" | "refund";
  amount: number;
  balance_after: number;
  description: string;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
};

export function WalletClient({
  initialWallet,
  initialTransactions,
}: {
  initialWallet: Wallet;
  initialTransactions: { data: Transaction[] };
}) {
  const [wallet, setWallet] = useState<Wallet>(initialWallet);
  const [transactions, setTransactions] = useState<Transaction[]>(
    initialTransactions.data || []
  );
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { success, error } = useAlertHelpers();

  if (!wallet) {
    return (
      <div className="flex flex-col min-h-screen bg-neutral-50/50 dark:bg-background">
        <Topbar title="My Wallet" />
        <main className="flex-1 p-6">
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-8 text-center text-red-500">
            Wallet data is missing. Please refresh the page.
          </div>
        </main>
      </div>
    );
  }

  const refreshData = async () => {
    try {
      const [walletRes, transactionsRes] = await Promise.all([
        fetch("/api/providers/me/wallet", { credentials: "include" }),
        fetch("/api/providers/me/wallet/transactions?limit=10", {
          credentials: "include",
        }),
      ]);

      if (walletRes.ok && transactionsRes.ok) {
        const walletData = await walletRes.json();
        const transData = await transactionsRes.json();
        setWallet(walletData.data);
        setTransactions(transData.data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      error("Please enter a valid amount");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/providers/me/wallet/deposit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (res.ok) {
        setIsDepositOpen(false);
        setDepositAmount("");
        await refreshData();
        success("Funds added successfully");
      } else {
        const errorData = await res.json();
        error(errorData.message || "Deposit failed");
      }
    } catch (e) {
      error("Network error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "deposit":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          >
            <ArrowUpIcon className="mr-1 size-3" />
            Deposit
          </Badge>
        );
      case "debit":
        return (
          <Badge
            variant="outline"
            className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
          >
            <ArrowDownIcon className="mr-1 size-3" />
            Debit
          </Badge>
        );
      case "refund":
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
          >
            <ArrowUpIcon className="mr-1 size-3" />
            Refund
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50/50 dark:bg-background">
      <Topbar title="My Wallet" />
      <main className="flex-1 p-6 w-full max-w-7xl mx-auto space-y-6 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Wallet & Balance
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your credits and view transaction history
            </p>
          </div>
          <Button onClick={() => setIsDepositOpen(true)}>
            <CurrencyDollarIcon className="mr-2 size-4" />
            Add Funds
          </Button>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Current Balance
              </span>
              <WalletIcon className="size-5 text-primary" />
            </div>
            <div className="text-3xl font-bold">
              {wallet.balance.toFixed(2)} {wallet.currency}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Total Deposited
              </span>
              <TrendUpIcon className="size-5 text-emerald-500" />
            </div>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {wallet.total_deposited.toFixed(2)} {wallet.currency}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Spent</span>
              <TrendDownIcon className="size-5 text-rose-500" />
            </div>
            <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">
              {wallet.total_spent.toFixed(2)} {wallet.currency}
            </div>
          </Card>
        </div>

        {/* Transactions Table */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance After</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No transactions yet
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(tx.created_at), "MMM d, yyyy")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(tx.created_at), "h:mm a")}
                        </div>
                      </TableCell>
                      <TableCell>{getTransactionBadge(tx.type)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {tx.description}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono font-medium ${
                          tx.type === "deposit" || tx.type === "refund"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {tx.type === "deposit" || tx.type === "refund"
                          ? "+"
                          : "-"}
                        {tx.amount.toFixed(2)} {wallet.currency}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {tx.balance_after.toFixed(2)} {wallet.currency}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Deposit Dialog */}
        <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Funds to Wallet</DialogTitle>
              <DialogDescription>
                Enter the amount you want to deposit
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ({wallet.currency})</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="100.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  min="1"
                  step="0.01"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  onClick={handleDeposit}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Confirm Deposit"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDepositOpen(false)}
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
