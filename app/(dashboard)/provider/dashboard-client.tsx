"use client";

import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  WalletIcon,
  StarIcon,
  LockKeyIcon,
  ShieldCheckIcon,
  TrendUpIcon,
  ArrowRightIcon,
  EnvelopeIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { format } from "date-fns";

type Profile = {
  id: string;
  provider_type: string;
  business_name: string | null;
  full_name: string | null;
  is_verified: boolean;
  average_rating: number;
  total_reviews: number;
  total_unlocks: number;
};

type Wallet = {
  balance: number;
  currency: string;
  total_deposited: number;
  total_spent: number;
} | null;

type Unlock = {
  id: string;
  unlock_fee: number;
  unlocked_at: string;
  request: {
    title: string;
    client: {
      full_name: string;
      email: string;
    };
  };
};

export function ProviderDashboardClient({
  profile,
  wallet,
  recentUnlocks,
}: {
  profile: Profile;
  wallet: Wallet;
  recentUnlocks: Unlock[];
}) {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-50/50 dark:bg-background">
      <Topbar title="Provider Overview" />
      <main className="flex-1 p-6 w-full max-w-7xl mx-auto space-y-6 pb-20">
        {/* Welcome Section */}
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Welcome back, {profile.full_name || profile.business_name || "Provider"}!
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Here's your business overview
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Wallet Balance
              </span>
              <WalletIcon className="size-5 text-primary" />
            </div>
            <div className="text-3xl font-bold">
              {wallet ? `${wallet.balance.toFixed(2)} ${wallet.currency}` : "N/A"}
            </div>
            <Link href="/provider/wallet">
              <Button variant="link" className="p-0 h-auto mt-2 text-xs">
                Manage Wallet <ArrowRightIcon className="ml-1 size-3" />
              </Button>
            </Link>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Verification Status
              </span>
              <ShieldCheckIcon
                className={`size-5 ${profile.is_verified ? "text-emerald-500" : "text-muted-foreground"}`}
              />
            </div>
            <div className="text-3xl font-bold">
              {profile.is_verified ? "Verified" : "Pending"}
            </div>
            {!profile.is_verified && (
              <p className="text-xs text-muted-foreground mt-2">
                Verification increases trust
              </p>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Average Rating
              </span>
              <StarIcon className="size-5 text-amber-500" />
            </div>
            <div className="text-3xl font-bold">
              {profile.average_rating.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              From {profile.total_reviews} reviews
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Total Unlocks
              </span>
              <LockKeyIcon className="size-5 text-primary" />
            </div>
            <div className="text-3xl font-bold">{profile.total_unlocks}</div>
            <Link href="/provider/leads">
              <Button variant="link" className="p-0 h-auto mt-2 text-xs">
                View Leads <ArrowRightIcon className="ml-1 size-3" />
              </Button>
            </Link>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link href="/provider/requests">
              <Button variant="outline" className="w-full justify-start">
                <TrendUpIcon className="mr-2 size-4" />
                Browse New Requests
              </Button>
            </Link>
            <Link href="/provider/leads">
              <Button variant="outline" className="w-full justify-start">
                <EnvelopeIcon className="mr-2 size-4" />
                View My Leads
              </Button>
            </Link>
            <Link href="/provider/profile">
              <Button variant="outline" className="w-full justify-start">
                <ShieldCheckIcon className="mr-2 size-4" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </Card>

        {/* Recent Unlocks */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Unlocks</h3>
            <Link href="/provider/leads">
              <Button variant="ghost" size="sm">
                View All <ArrowRightIcon className="ml-1 size-4" />
              </Button>
            </Link>
          </div>
          {recentUnlocks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <LockKeyIcon className="size-12 mx-auto mb-2 opacity-50" />
              <p>No unlocks yet</p>
              <Link href="/provider/requests">
                <Button variant="link" className="mt-2">
                  Browse Requests
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentUnlocks.map((unlock) => (
                <div
                  key={unlock.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {unlock.request.title}
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      Client: {unlock.request.client.full_name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {format(new Date(unlock.unlocked_at), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-mono font-medium text-sm">
                      {unlock.unlock_fee.toFixed(2)} EGP
                    </div>
                    <Badge
                      variant="outline"
                      className="mt-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    >
                      Completed
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Wallet Summary (if available) */}
        {wallet && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                Total Deposited
              </h3>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {wallet.total_deposited.toFixed(2)} {wallet.currency}
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                Total Spent
              </h3>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {wallet.total_spent.toFixed(2)} {wallet.currency}
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
