"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  UserPlusIcon,
  ShieldCheckIcon,
  ShieldWarningIcon,
  CopyIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  PhoneIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useAlertHelpers } from "@/components/ui/alert-toast";

type Admin = {
  id: string;
  email: string;
  is_blocked: boolean;
  email_verified: boolean;
  created_at: string;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
  } | null;
};

type CreatedCredentials = {
  email: string;
  full_name: string;
  temp_password: string;
};

export default function AdminTeamClient({
  initialAdmins,
}: {
  initialAdmins: Admin[];
}) {
  const [admins, setAdmins] = useState<Admin[]>(initialAdmins);
  const [searchQuery, setSearchQuery] = useState("");

  // Create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Credentials reveal dialog (shown post-creation)
  const [credentials, setCredentials] = useState<CreatedCredentials | null>(
    null,
  );
  const [copiedField, setCopiedField] = useState<"email" | "password" | null>(
    null,
  );

  // Remove confirmation
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const { success, error } = useAlertHelpers();

  const filteredAdmins = admins.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      q === "" ||
      a.profile?.full_name?.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q)
    );
  });

  const handleCreate = async () => {
    if (!email.trim() || !fullName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          full_name: fullName.trim(),
          phone: phone.trim() || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setAdmins((prev) => [...prev, data.admin]);
        setIsCreateOpen(false);
        resetForm();
        setCredentials({
          email: email.trim(),
          full_name: fullName.trim(),
          temp_password: data.temp_password,
        });
      } else {
        await error(data.message || "Failed to create admin");
      }
    } catch {
      await error("Network error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRemove = async (id: string) => {
    setIsRemoving(true);
    try {
      const res = await fetch(`/api/admin/admins/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        setAdmins((prev) => prev.filter((a) => a.id !== id));
        setRemovingId(null);
        await success("Admin privileges revoked");
      } else {
        await error(data.message || "Failed to remove admin");
      }
    } catch {
      await error("Network error occurred");
    } finally {
      setIsRemoving(false);
    }
  };

  const copyToClipboard = async (text: string, field: "email" | "password") => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPhone("");
  };

  const getInitials = (admin: Admin) =>
    (admin.profile?.full_name || admin.email).charAt(0).toUpperCase();

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50/50 dark:bg-background">
      <Topbar title="Admin Team" />
      <main className="flex-1 p-6 w-full max-w-5xl mx-auto space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Administration
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Manage admin accounts. All actions are permanently logged.
            </p>
          </div>
          <Button
            className="shrink-0 shadow-sm"
            onClick={() => setIsCreateOpen(true)}
          >
            <UserPlusIcon className="mr-2 size-4" />
            Add Admin
          </Button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border bg-card shadow-sm px-4 py-3">
            <p className="text-xs text-muted-foreground mb-0.5">Total Admins</p>
            <p className="text-2xl font-bold">{admins.length}</p>
          </div>
          <div className="rounded-xl border bg-card shadow-sm px-4 py-3">
            <p className="text-xs text-muted-foreground mb-0.5">Active</p>
            <p className="text-2xl font-bold text-emerald-600">
              {admins.filter((a) => !a.is_blocked).length}
            </p>
          </div>
          <div className="rounded-xl border bg-card shadow-sm px-4 py-3 hidden sm:block">
            <p className="text-xs text-muted-foreground mb-0.5">Blocked</p>
            <p className="text-2xl font-bold text-rose-500">
              {admins.filter((a) => a.is_blocked).length}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9 bg-card shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[40%]">Admin</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdmins.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {admins.length === 0
                      ? "No admins found."
                      : "No admins match your search."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdmins.map((admin) => (
                  <TableRow key={admin.id} className="hover:bg-muted/30">
                    {/* Identity */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="size-9 shrink-0 rounded-full bg-primary/10 border border-border/50 flex items-center justify-center text-primary font-semibold text-sm overflow-hidden">
                          {admin.profile?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={admin.profile.avatar_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            getInitials(admin)
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            {admin.profile?.full_name || "—"}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono truncate flex items-center gap-1">
                            <EnvelopeIcon className="size-3 shrink-0" />
                            {admin.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Phone */}
                    <TableCell className="text-sm text-muted-foreground">
                      {admin.profile?.phone ? (
                        <span className="flex items-center gap-1">
                          <PhoneIcon className="size-3.5 shrink-0" />
                          {admin.profile.phone}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>

                    {/* Joined */}
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(admin.created_at), "MMM d, yyyy")}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {admin.is_blocked ? (
                        <Badge
                          variant="outline"
                          className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                        >
                          <ShieldWarningIcon className="mr-1 size-3" />
                          Blocked
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        >
                          <ShieldCheckIcon className="mr-1 size-3" />
                          Active
                        </Badge>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right pr-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                        onClick={() => setRemovingId(admin.id)}
                      >
                        <TrashIcon className="mr-1.5 size-3.5" />
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* ── Create Admin Dialog ── */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Administrator</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            A temporary password will be auto-generated and sent to the new
            admin&apos;s email.
          </p>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Full Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. Sara Ahmed"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Email Address <span className="text-destructive">*</span>
              </label>
              <Input
                type="email"
                placeholder="e.g. sara@rabet.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Phone{" "}
                <span className="text-muted-foreground text-xs font-normal">
                  (optional)
                </span>
              </label>
              <Input
                placeholder="+20 10 0000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!fullName.trim() || !email.trim() || isCreating}
              onClick={handleCreate}
            >
              <UserPlusIcon className="mr-2 size-4" />
              {isCreating ? "Creating..." : "Create Admin"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Credentials Dialog (shown after creation) ── */}
      <Dialog
        open={!!credentials}
        onOpenChange={(open) => !open && setCredentials(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <ShieldCheckIcon className="size-5" />
              Admin Created Successfully
            </DialogTitle>
          </DialogHeader>
          {credentials && (
            <div className="space-y-4 py-1">
              <p className="text-sm text-muted-foreground">
                A welcome email has been sent to{" "}
                <span className="font-medium text-foreground">
                  {credentials.email}
                </span>
                . Copy the credentials below to share them directly if needed.
              </p>
              <div className="rounded-xl border bg-muted/40 divide-y">
                {/* Email row */}
                <div className="flex items-center justify-between px-4 py-3 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-mono font-medium">
                      {credentials.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(credentials.email, "email")}
                    className="shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title="Copy email"
                  >
                    {copiedField === "email" ? (
                      <CheckIcon className="size-4 text-emerald-500" />
                    ) : (
                      <CopyIcon className="size-4" />
                    )}
                  </button>
                </div>

                {/* Password row */}
                <div className="flex items-center justify-between px-4 py-3 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Temporary Password
                    </p>
                    <p className="text-sm font-mono font-medium tracking-wide">
                      {credentials.temp_password}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(credentials.temp_password, "password")
                    }
                    className="shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title="Copy password"
                  >
                    {copiedField === "password" ? (
                      <CheckIcon className="size-4 text-emerald-500" />
                    ) : (
                      <CopyIcon className="size-4" />
                    )}
                  </button>
                </div>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ This password will not be shown again. Ask the admin to
                change it after first login.
              </p>
            </div>
          )}
          <div className="flex justify-end pt-1">
            <Button onClick={() => setCredentials(null)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Remove Confirmation Dialog ── */}
      <Dialog
        open={!!removingId}
        onOpenChange={(open) => !open && setRemovingId(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Revoke Admin Privileges</DialogTitle>
          </DialogHeader>
          {removingId && (
            <>
              <div className="space-y-2 py-1">
                <p className="text-sm text-muted-foreground">
                  This will downgrade{" "}
                  <span className="font-medium text-foreground">
                    {admins.find((a) => a.id === removingId)?.profile
                      ?.full_name ||
                      admins.find((a) => a.id === removingId)?.email}
                  </span>{" "}
                  from admin to a regular client account. This action is logged.
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setRemovingId(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={isRemoving}
                  onClick={() => handleRemove(removingId)}
                >
                  <TrashIcon className="mr-2 size-4" />
                  {isRemoving ? "Removing..." : "Revoke Access"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
