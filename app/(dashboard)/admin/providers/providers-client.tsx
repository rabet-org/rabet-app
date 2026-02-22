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
import { Label } from "@/components/ui/label";
import {
  ShieldCheckIcon,
  ShieldWarningIcon,
  WalletIcon,
  StarIcon,
  PlusIcon,
  MinusIcon,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAlertHelpers } from "@/components/ui/alert-toast";

type Provider = {
  id: string;
  user_id: string;
  is_verified: boolean;
  verified_at: string | null;
  user: {
    email: string;
    profile: {
      full_name: string;
    } | null;
  };
  application: {
    provider_type: string;
    business_name: string | null;
  };
  wallet: {
    balance: string;
    currency: string;
  } | null;
  _count: {
    reviews: number;
    unlocks: number;
  };
};

export function ProvidersClient({
  initialProviders,
}: {
  initialProviders: Provider[];
}) {
  const [providers, setProviders] = useState<Provider[]>(initialProviders);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  
  const { success, error, confirm } = useAlertHelpers();

  const refreshProviders = async () => {
    try {
      const res = await fetch("/api/admin/providers?limit=100", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setProviders(data.data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleVerify = async (id: string, currentStatus: boolean) => {
    const confirmed = await confirm(
      `Are you sure you want to ${currentStatus ? "unverify" : "verify"} this provider?`,
      "Confirm Action"
    );
    
    if (!confirmed) return;

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/providers/${id}/verify`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_verified: !currentStatus }),
      });

      if (res.ok) {
        await refreshProviders();
        success("Provider verification status updated successfully");
      } else {
        const errorData = await res.json();
        error(errorData.message || "Action failed");
      }
    } catch (e) {
      error("Network error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWalletAdjust = async () => {
    if (!selectedProvider || !adjustAmount || !adjustReason) {
      error("Please fill in all fields");
      return;
    }

    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount === 0) {
      error("Please enter a valid amount");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(
        `/api/admin/providers/${selectedProvider.id}/wallet/adjust`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            reason: adjustReason,
          }),
        }
      );

      if (res.ok) {
        setIsWalletOpen(false);
        setSelectedProvider(null);
        setAdjustAmount("");
        setAdjustReason("");
        await refreshProviders();
        success("Wallet balance adjusted successfully");
      } else {
        const errorData = await res.json();
        error(errorData.message || "Failed to adjust wallet");
      }
    } catch (e) {
      error("Network error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50/50 dark:bg-background">
      <Topbar title="Providers" />
      <main className="flex-1 p-6 w-full max-w-7xl mx-auto space-y-6 pb-20">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Provider Management
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage provider verification and wallets
          </p>
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[250px]">Provider</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Wallet Balance</TableHead>
                  <TableHead>Reviews</TableHead>
                  <TableHead>Unlocks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No providers found
                    </TableCell>
                  </TableRow>
                ) : (
                  providers.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {provider.application.business_name ||
                              provider.user.profile?.full_name ||
                              "N/A"}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {provider.user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {provider.application.provider_type}
                      </TableCell>
                      <TableCell>
                        {provider.wallet ? (
                          <span className="font-mono font-medium">
                            {parseFloat(provider.wallet.balance).toFixed(2)}{" "}
                            {provider.wallet.currency}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">No wallet</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <StarIcon className="size-4 text-amber-500" />
                          <span>{provider._count.reviews}</span>
                        </div>
                      </TableCell>
                      <TableCell>{provider._count.unlocks}</TableCell>
                      <TableCell>
                        {provider.is_verified ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          >
                            <ShieldCheckIcon className="mr-1 size-3" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          >
                            <ShieldWarningIcon className="mr-1 size-3" />
                            Unverified
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVerify(provider.id, provider.is_verified)}
                            disabled={isProcessing}
                          >
                            {provider.is_verified ? (
                              <>
                                <ShieldWarningIcon className="mr-1.5 size-4" />
                                Unverify
                              </>
                            ) : (
                              <>
                                <ShieldCheckIcon className="mr-1.5 size-4" />
                                Verify
                              </>
                            )}
                          </Button>
                          {provider.wallet && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedProvider(provider);
                                setIsWalletOpen(true);
                              }}
                            >
                              <WalletIcon className="mr-1.5 size-4" />
                              Adjust
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Wallet Adjust Dialog */}
        <Dialog open={isWalletOpen} onOpenChange={setIsWalletOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adjust Wallet Balance</DialogTitle>
              <DialogDescription>
                Add or deduct credits from provider wallet
              </DialogDescription>
            </DialogHeader>
            {selectedProvider && (
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="text-sm text-muted-foreground mb-1">
                    Current Balance
                  </div>
                  <div className="text-2xl font-bold font-mono">
                    {selectedProvider.wallet
                      ? `${parseFloat(selectedProvider.wallet.balance).toFixed(2)} ${selectedProvider.wallet.currency}`
                      : "N/A"}
                  </div>
                </div>

                <div>
                  <Label htmlFor="amount">
                    Amount (use negative for deduction)
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="100.00 or -50.00"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    step="0.01"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="reason">Reason *</Label>
                  <Input
                    id="reason"
                    placeholder="e.g., Refund for issue #123"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1"
                    onClick={handleWalletAdjust}
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Processing..." : "Adjust Balance"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsWalletOpen(false);
                      setSelectedProvider(null);
                      setAdjustAmount("");
                      setAdjustReason("");
                    }}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
