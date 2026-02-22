"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldWarningIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type User = {
  id: string;
  email: string;
  role: "client" | "provider" | "admin";
  is_blocked: boolean;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  profile: {
    full_name: string;
    phone: string | null;
  } | null;
  _count: { requests: number };
  provider_profile: {
    is_verified: boolean;
    wallet: { balance: string; currency: string } | null;
    subscription: { plan_type: string; status: string } | null;
    _count: { reviews: number };
  } | null;
};

export default function AdminUsersClient({
  initialData,
}: {
  initialData: User[];
}) {
  const [users, setUsers] = useState<User[]>(initialData);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const isFirstMount = useRef(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "active", "pending", "banned"

  const fetchUsers = useCallback(async () => {
    setIsFetching(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (roleFilter !== "all") params.set("role", roleFilter);

      // We handle the "is_blocked" directly in the backend but "active" vs "pending" is custom
      if (statusFilter === "banned") params.set("is_blocked", "true");
      else if (statusFilter === "active" || statusFilter === "pending")
        params.set("is_blocked", "false");

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        credentials: "include",
      });
      if (res.ok) {
        const json = await res.json();
        let fetchedUsers: User[] = json.data || [];

        // Manual client-side filtering for is_active / pending since the backend doesn't explicitly filter by it via param yet
        if (statusFilter === "pending")
          fetchedUsers = fetchedUsers.filter((u) => !u.is_active);
        if (statusFilter === "active")
          fetchedUsers = fetchedUsers.filter((u) => u.is_active);

        setUsers(fetchedUsers);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetching(false);
    }
  }, [searchQuery, roleFilter, statusFilter]);

  const mountedParams = useRef({ search: "", role: "all", status: "all" });

  // Debounced search trigger
  useEffect(() => {
    // Prevent fetching on initial mount or StrictMode remounts unless filters actually changed
    const currentParams = {
      search: searchQuery,
      role: roleFilter,
      status: statusFilter,
    };
    if (
      mountedParams.current.search === currentParams.search &&
      mountedParams.current.role === currentParams.role &&
      mountedParams.current.status === currentParams.status
    ) {
      return;
    }

    mountedParams.current = currentParams;

    const timer = setTimeout(() => {
      fetchUsers();
    }, 400); // 400ms debounce
    return () => clearTimeout(timer);
  }, [searchQuery, roleFilter, statusFilter, fetchUsers]);

  const toggleBan = async (id: string, currentlyBlocked: boolean) => {
    if (
      !confirm(
        `Are you sure you want to ${currentlyBlocked ? "unban" : "ban"} this user?`,
      )
    )
      return;

    setIsUpdating(true);
    try {
      const action = currentlyBlocked ? "unblock" : "block";
      const res = await fetch(`/api/admin/users/${id}/block`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason:
            action === "block" ? "Violation of platform terms." : undefined,
        }),
      });

      if (res.ok) {
        setSelectedUser(null);
        await fetchUsers();
      } else {
        const data = await res.json();
        alert(data.message || "Action failed");
      }
    } catch (e) {
      alert("Network error occurred.");
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge
            variant="default"
            className="bg-fuchsia-500/15 text-fuchsia-500 hover:bg-fuchsia-500/25 border-fuchsia-500/20"
          >
            Admin
          </Badge>
        );
      case "provider":
        return (
          <Badge
            variant="default"
            className="bg-blue-500/15 text-blue-500 hover:bg-blue-500/25 border-blue-500/20"
          >
            Provider
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="text-muted-foreground border-neutral-700"
          >
            Client
          </Badge>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50/50 dark:bg-background relative">
      <Topbar title="User Management" />
      <main className="flex-1 p-6 w-full max-w-7xl mx-auto space-y-6 overflow-y-auto pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Accounts Directory
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Manage all platform users, their roles, and access status.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="client">Clients</SelectItem>
                <SelectItem value="provider">Providers</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending Setup</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[300px]">User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead>Email Verified</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Quick Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isFetching ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-9 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-[150px]" />
                            <Skeleton className="h-3 w-[100px]" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-[80px] rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[100px] mb-1.5" />
                        <Skeleton className="h-3 w-[60px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[40px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-[80px] rounded-full" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-[100px] ml-auto pb-1" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No users found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow
                      key={user.id}
                      className="group cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setSelectedUser(user)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                            {user.profile?.full_name?.charAt(0).toUpperCase() ||
                              user.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                              {user.profile?.full_name || "Anonymous User"}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {format(new Date(user.created_at), "MMM d, yyyy")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(user.created_at), "h:mm a")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.email_verified ? (
                          <div className="flex items-center justify-start text-emerald-600 dark:text-emerald-500 text-sm font-medium">
                            <ShieldCheckIcon className="mr-1.5 size-4" /> Yes
                          </div>
                        ) : (
                          <div className="flex items-center justify-start text-muted-foreground text-sm">
                            <ShieldWarningIcon className="mr-1.5 size-4" /> No
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.is_blocked ? (
                          <Badge
                            variant="outline"
                            className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                          >
                            Banned
                          </Badge>
                        ) : !user.is_active ? (
                          <Badge
                            variant="outline"
                            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          >
                            Pending Setup
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          >
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.role !== "admin" && (
                          <Button
                            variant={user.is_blocked ? "outline" : "ghost"}
                            size="sm"
                            disabled={isUpdating}
                            className={
                              user.is_blocked
                                ? "border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                : "text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
                            }
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent opening the dialog
                              toggleBan(user.id, user.is_blocked);
                            }}
                          >
                            {user.is_blocked ? (
                              <>
                                <ShieldCheckIcon className="mr-2 size-4" />{" "}
                                Unban
                              </>
                            ) : (
                              <>
                                <ShieldWarningIcon className="mr-2 size-4" />{" "}
                                Ban User
                              </>
                            )}
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

        {/* Detailed User Dialog */}
        <Dialog
          open={!!selectedUser}
          onOpenChange={(open) => !open && setSelectedUser(null)}
        >
          <DialogContent className="max-w-lg overflow-y-auto max-h-[90dvh]">
            <DialogHeader>
              <DialogTitle>User Profile</DialogTitle>
              <DialogDescription>
                Full administrative view of this account.
              </DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-5 pb-2">
                {/* Avatar + Identity */}
                <div className="flex items-center gap-4 p-4 rounded-xl border bg-muted/40">
                  <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl shrink-0">
                    {selectedUser.profile?.full_name?.charAt(0).toUpperCase() ||
                      selectedUser.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-lg leading-tight truncate">
                      {selectedUser.profile?.full_name || "Anonymous User"}
                    </h3>
                    <p className="text-sm text-muted-foreground font-mono truncate">
                      {selectedUser.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {getRoleBadge(selectedUser.role)}
                      {selectedUser.is_blocked ? (
                        <Badge
                          variant="outline"
                          className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                        >
                          Banned
                        </Badge>
                      ) : !selectedUser.is_active ? (
                        <Badge
                          variant="outline"
                          className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        >
                          Pending Setup
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        >
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Activity Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border bg-card p-3 text-center">
                    <div className="text-2xl font-bold">
                      {selectedUser._count?.requests ?? 0}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Requests
                    </div>
                  </div>
                  {selectedUser.provider_profile ? (
                    <>
                      <div className="rounded-xl border bg-card p-3 text-center">
                        <div className="text-2xl font-bold">
                          {selectedUser.provider_profile._count.reviews}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Reviews
                        </div>
                      </div>
                      <div className="rounded-xl border bg-card p-3 text-center">
                        <div className="text-2xl font-bold font-mono">
                          {selectedUser.provider_profile.wallet
                            ? `${Number(selectedUser.provider_profile.wallet.balance).toFixed(0)}`
                            : "—"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {selectedUser.provider_profile.wallet?.currency ||
                            "Wallet"}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2 rounded-xl border bg-card p-3 flex items-center justify-center text-xs text-muted-foreground">
                      No provider profile
                    </div>
                  )}
                </div>

                {/* Account Details */}
                <div className="rounded-xl border bg-card">
                  <div className="px-4 py-2.5 border-b">
                    <h4 className="text-sm font-semibold">Account Details</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Phone
                      </span>
                      <span className="font-medium">
                        {selectedUser.profile?.phone || "Not provided"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Email Verified
                      </span>
                      <span
                        className={`font-medium ${selectedUser.email_verified ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
                      >
                        {selectedUser.email_verified ? "Yes ✓" : "No"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Member Since
                      </span>
                      <span className="font-medium">
                        {format(
                          new Date(selectedUser.created_at),
                          "MMM d, yyyy",
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Local Time
                      </span>
                      <span className="font-medium">
                        {format(new Date(selectedUser.created_at), "h:mm a")}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        System ID
                      </span>
                      <code className="text-[10px] bg-muted px-2 py-1 rounded block font-mono break-all">
                        {selectedUser.id}
                      </code>
                    </div>
                  </div>
                </div>

                {/* Provider Details (if applicable) */}
                {selectedUser.provider_profile && (
                  <div className="rounded-xl border bg-card">
                    <div className="px-4 py-2.5 border-b flex items-center justify-between">
                      <h4 className="text-sm font-semibold">
                        Provider Details
                      </h4>
                      {selectedUser.provider_profile.is_verified ? (
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs"
                        >
                          Verified
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs"
                        >
                          Unverified
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs block mb-0.5">
                          Subscription Plan
                        </span>
                        <span className="font-medium capitalize">
                          {selectedUser.provider_profile.subscription
                            ?.plan_type || "Free"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs block mb-0.5">
                          Sub. Status
                        </span>
                        <span className="font-medium capitalize">
                          {selectedUser.provider_profile.subscription?.status ||
                            "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs block mb-0.5">
                          Wallet Balance
                        </span>
                        <span className="font-mono font-medium">
                          {selectedUser.provider_profile.wallet
                            ? `${Number(selectedUser.provider_profile.wallet.balance).toFixed(2)} ${selectedUser.provider_profile.wallet.currency}`
                            : "No wallet"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs block mb-0.5">
                          Total Reviews
                        </span>
                        <span className="font-medium">
                          {selectedUser.provider_profile._count.reviews}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {selectedUser.role !== "admin" && (
                  <div className="flex gap-3 pt-1">
                    <Button
                      variant={
                        selectedUser.is_blocked ? "outline" : "destructive"
                      }
                      className={`w-full ${selectedUser.is_blocked ? "border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10" : ""}`}
                      disabled={isUpdating}
                      onClick={() =>
                        toggleBan(selectedUser.id, selectedUser.is_blocked)
                      }
                    >
                      {selectedUser.is_blocked ? (
                        <>
                          <ShieldCheckIcon className="mr-2 size-4" /> Lift
                          Account Ban
                        </>
                      ) : (
                        <>
                          <ShieldWarningIcon className="mr-2 size-4" /> Ban this
                          Account
                        </>
                      )}
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
