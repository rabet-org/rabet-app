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
  MagnifyingGlassIcon,
  FunnelIcon,
  BuildingsIcon,
  EnvelopeIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
  SlidersHorizontalIcon,
} from "@phosphor-icons/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  description: string | null;
  created_at: string;
  user: {
    email: string;
    profile: {
      full_name: string;
      phone: string | null;
      avatar_url: string | null;
    } | null;
  };
  application: {
    provider_type: string;
    business_name: string | null;
  };
  services: { category: { id: string; name: string; icon: string | null } }[];
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
  initialTotal,
  initialSearch = "",
}: {
  initialProviders: Provider[];
  initialTotal: number;
  initialSearch?: string;
}) {
  const [providers, setProviders] = useState<Provider[]>(initialProviders);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");

  // Advanced Filters
  const [minWallet, setMinWallet] = useState<string>("");
  const [maxWallet, setMaxWallet] = useState<string>("");
  const [minReviews, setMinReviews] = useState<string>("");
  const [maxReviews, setMaxReviews] = useState<string>("");
  const [minUnlocks, setMinUnlocks] = useState<string>("");
  const [maxUnlocks, setMaxUnlocks] = useState<string>("");

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
      "Confirm Action",
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

  const filteredProviders = providers
    .filter((p) => {
      const searchLower = searchQuery.toLowerCase();
      const nameMatch =
        p.user.profile?.full_name?.toLowerCase().includes(searchLower) || false;
      const emailMatch = p.user.email.toLowerCase().includes(searchLower);
      const businessMatch =
        p.application.business_name?.toLowerCase().includes(searchLower) ||
        false;
      const idMatch = p.id.toLowerCase().includes(searchLower);

      const matchesSearch =
        searchQuery === "" ||
        nameMatch ||
        emailMatch ||
        businessMatch ||
        idMatch;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "verified" && p.is_verified) ||
        (statusFilter === "unverified" && !p.is_verified);

      // Advanced Filters Logic
      const walletBalance = parseFloat(p.wallet?.balance || "0");
      const minW = minWallet ? parseFloat(minWallet) : 0;
      const maxW = maxWallet ? parseFloat(maxWallet) : Infinity;
      const matchesWallet = walletBalance >= minW && walletBalance <= maxW;

      const reviewCount = p._count.reviews;
      const minR = minReviews ? parseInt(minReviews, 10) : 0;
      const maxR = maxReviews ? parseInt(maxReviews, 10) : Infinity;
      const matchesReviews = reviewCount >= minR && reviewCount <= maxR;

      const unlockCount = p._count.unlocks;
      const minU = minUnlocks ? parseInt(minUnlocks, 10) : 0;
      const maxU = maxUnlocks ? parseInt(maxUnlocks, 10) : Infinity;
      const matchesUnlocks = unlockCount >= minU && unlockCount <= maxU;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesWallet &&
        matchesReviews &&
        matchesUnlocks
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "wallet_desc": {
          const wA = parseFloat(a.wallet?.balance || "0");
          const wB = parseFloat(b.wallet?.balance || "0");
          return wB - wA; // Highest to lowest
        }
        case "reviews_desc":
          return b._count.reviews - a._count.reviews;
        case "unlocks_desc":
          return b._count.unlocks - a._count.unlocks;
        case "recent":
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50/50 dark:bg-background">
      <Topbar title="Providers" />
      <main className="flex-1 p-6 w-full max-w-7xl mx-auto space-y-6 pb-20">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Provider Management
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage provider verification and reviews
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Showing{" "}
            <span className="font-medium text-foreground">
              {filteredProviders.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">
              {initialTotal.toLocaleString()}
            </span>{" "}
            providers
          </p>
        </div>

        {providers.length >= 100 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <span className="font-semibold">⚠</span>
            Results are limited to 100 records. Use search and filters to narrow
            down.
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4.5" />
            <Input
              placeholder="Search by name, email, business..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card shadow-sm"
            />
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-card shadow-sm">
                <div className="flex items-center gap-2">
                  <FunnelIcon className="size-4 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] bg-card shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                    Sort by
                  </span>
                  <SelectValue placeholder="Sort..." />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent Setup</SelectItem>
                <SelectItem value="wallet_desc">Highest Balance</SelectItem>
                <SelectItem value="reviews_desc">Most Reviews</SelectItem>
                <SelectItem value="unlocks_desc">Most Unlocks</SelectItem>
              </SelectContent>
            </Select>

            {/* Advanced Filters Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="bg-card shadow-sm gap-2">
                  <SlidersHorizontalIcon className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                    Filters
                  </span>
                  {(minWallet ||
                    maxWallet ||
                    minReviews ||
                    maxReviews ||
                    minUnlocks ||
                    maxUnlocks) && (
                    <span className="flex size-2 rounded-full bg-primary" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-80 sm:max-w-md p-6 space-y-6">
                <SheetHeader>
                  <SheetTitle>Advanced Filters</SheetTitle>
                  <SheetDescription>
                    Set ranges to narrow down the provider list.
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 mt-4">
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Wallet Balance
                    </label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={minWallet}
                        onChange={(e) => setMinWallet(e.target.value)}
                        className="h-9 text-sm"
                      />
                      <span className="text-muted-foreground text-sm">-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={maxWallet}
                        onChange={(e) => setMaxWallet(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Reviews
                    </label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={minReviews}
                        onChange={(e) => setMinReviews(e.target.value)}
                        className="h-9 text-sm"
                      />
                      <span className="text-muted-foreground text-sm">-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={maxReviews}
                        onChange={(e) => setMaxReviews(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Unlocks
                    </label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={minUnlocks}
                        onChange={(e) => setMinUnlocks(e.target.value)}
                        className="h-9 text-sm"
                      />
                      <span className="text-muted-foreground text-sm">-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={maxUnlocks}
                        onChange={(e) => setMaxUnlocks(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>

                  <div className="pt-6 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMinWallet("");
                        setMaxWallet("");
                        setMinReviews("");
                        setMaxReviews("");
                        setMinUnlocks("");
                        setMaxUnlocks("");
                      }}
                      className="text-muted-foreground"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden w-full">
          <div className="w-full overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[30%] min-w-[200px]">
                    Provider
                  </TableHead>
                  <TableHead className="w-[15%] min-w-[120px]">Type</TableHead>
                  <TableHead className="w-[15%] min-w-[120px]">
                    Wallet
                  </TableHead>
                  <TableHead className="w-[15%] min-w-[100px]">
                    Reviews
                  </TableHead>
                  <TableHead className="w-[15%] min-w-[100px]">
                    Unlocks
                  </TableHead>
                  <TableHead className="w-[10%] min-w-[120px]">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProviders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground"
                    >
                      {providers.length === 0
                        ? "No providers found."
                        : "No providers match your search."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProviders.map((provider) => (
                    <TableRow
                      key={provider.id}
                      className="group hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedProvider(provider)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="size-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm overflow-hidden border border-border/50">
                            {provider.user.profile?.avatar_url ? (
                              <img
                                src={provider.user.profile.avatar_url}
                                alt="Provider Avatar"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (
                                provider.application.business_name ||
                                provider.user.profile?.full_name ||
                                provider.user.email
                              )
                                .charAt(0)
                                .toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium group-hover:text-primary transition-colors truncate text-sm">
                              {provider.application.business_name ||
                                provider.user.profile?.full_name ||
                                "N/A"}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono truncate">
                              {provider.user.email}
                            </div>
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
                          <span className="text-muted-foreground">
                            No wallet
                          </span>
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Provider Detail Dialog */}
        <Dialog
          open={!!selectedProvider}
          onOpenChange={(open) => !open && setSelectedProvider(null)}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Provider Details</DialogTitle>
            </DialogHeader>

            {selectedProvider && (
              <div className="space-y-4 pb-1 overflow-y-auto max-h-[85vh] px-1">
                {/* Identity Card */}
                <div className="flex items-center gap-4 p-4 rounded-xl border bg-muted/40">
                  <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl shrink-0 overflow-hidden">
                    {selectedProvider.user.profile?.avatar_url ? (
                      <img
                        src={selectedProvider.user.profile.avatar_url}
                        alt="Provider avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (
                        selectedProvider.application.business_name ||
                        selectedProvider.user.profile?.full_name ||
                        selectedProvider.user.email
                      )
                        .charAt(0)
                        .toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-lg leading-tight truncate">
                      {selectedProvider.application.business_name ||
                        selectedProvider.user.profile?.full_name ||
                        "Anonymous Provider"}
                    </h3>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5 font-mono truncate">
                      <EnvelopeIcon className="size-3.5 shrink-0" />
                      {selectedProvider.user.email}
                    </div>
                    {selectedProvider.user.profile?.phone && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5 truncate">
                        <span className="text-[10px] shrink-0 font-medium bg-muted-foreground/15 text-muted-foreground px-1 py-0.5 rounded leading-none uppercase">
                          Tel
                        </span>
                        {selectedProvider.user.profile.phone}
                      </div>
                    )}
                  </div>
                </div>

                {/* Description Space */}
                <div className="px-1 space-y-2">
                  <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider block">
                    About Provider
                  </span>
                  <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {selectedProvider.description || "No description provided."}
                  </p>
                </div>

                {/* Verified Services */}
                <div className="px-1 space-y-2 pt-1">
                  <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <TagIcon className="size-3.5" />
                    Verified Services
                  </span>
                  {selectedProvider.services &&
                  selectedProvider.services.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedProvider.services.map((ps) => (
                        <Badge
                          key={ps.category.id}
                          variant="secondary"
                          className="font-normal bg-muted border-transparent"
                        >
                          {ps.category.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">
                      No verified services.
                    </span>
                  )}
                </div>

                {/* Business & Stats Grid */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="rounded-xl border bg-card">
                    <div className="px-4 py-2.5 border-b flex items-center gap-2">
                      <BuildingsIcon className="size-4 text-muted-foreground" />
                      <h4 className="text-sm font-semibold">Timeline & Info</h4>
                    </div>
                    <div className="p-4 space-y-3 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs block mb-0.5">
                          Type
                        </span>
                        <span className="font-medium capitalize">
                          {selectedProvider.application.provider_type}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs block mb-0.5">
                          Date Joined
                        </span>
                        <span className="font-medium">
                          {format(
                            new Date(selectedProvider.created_at),
                            "MMM d, yyyy",
                          )}
                        </span>
                      </div>
                      {selectedProvider.verified_at && (
                        <div>
                          <span className="text-muted-foreground text-xs block mb-0.5">
                            Date Verified
                          </span>
                          <span className="font-medium">
                            {format(
                              new Date(selectedProvider.verified_at),
                              "MMM d, yyyy",
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border bg-card">
                    <div className="px-4 py-2.5 border-b flex items-center gap-2">
                      <WalletIcon className="size-4 text-muted-foreground" />
                      <h4 className="text-sm font-semibold">Activity Stats</h4>
                    </div>
                    <div className="p-4 space-y-3 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs block mb-0.5">
                          Wallet Balance
                        </span>
                        {selectedProvider.wallet ? (
                          <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                            {parseFloat(
                              selectedProvider.wallet.balance,
                            ).toFixed(2)}{" "}
                            {selectedProvider.wallet.currency}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                      <div className="flex gap-4">
                        <div>
                          <span className="text-muted-foreground text-xs block mb-0.5">
                            Reviews
                          </span>
                          <span className="font-medium flex items-center gap-1">
                            <StarIcon className="size-3.5 text-amber-500" />
                            {selectedProvider._count.reviews}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block mb-0.5">
                            Unlocks
                          </span>
                          <span className="font-medium flex items-center gap-1">
                            <TagIcon className="size-3.5 text-muted-foreground" />
                            {selectedProvider._count.unlocks}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Action */}
                <div className="pt-2">
                  <Button
                    variant={
                      selectedProvider.is_verified ? "outline" : "default"
                    }
                    className={
                      selectedProvider.is_verified
                        ? "w-full border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/60"
                        : "w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVerify(
                        selectedProvider.id,
                        selectedProvider.is_verified,
                      );
                      setSelectedProvider(null);
                    }}
                    disabled={isProcessing}
                  >
                    {selectedProvider.is_verified ? (
                      <>
                        <ShieldWarningIcon className="mr-2 size-4" />
                        Revoke Verification
                      </>
                    ) : (
                      <>
                        <ShieldCheckIcon className="mr-2 size-4" />
                        Verify Provider
                      </>
                    )}
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
