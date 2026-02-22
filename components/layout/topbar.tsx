"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BellIcon,
  CaretRightIcon,
  CheckCircleIcon,
  GearIcon,
  SignOutIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import { useMemo, useState, useEffect, useCallback } from "react";
import { format } from "date-fns";

function useBreadcrumbs(pathname: string) {
  return useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((seg, i) => ({
      label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
      href: "/" + segments.slice(0, i + 1).join("/"),
      isLast: i === segments.length - 1,
    }));
  }, [pathname]);
}

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

interface TopbarProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

export function Topbar({
  title,
  description,
  actions,
  className,
  ...props
}: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const breadcrumbs = useBreadcrumbs(pathname);

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=8", {
        credentials: "include",
      });
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.data || []);
        setUnreadCount(json.unread_count || 0);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll every 60s to keep count fresh
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications/mark-all-read", {
        method: "POST",
        credentials: "include",
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/proxy-logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.push("/login");
    }
  };

  const role =
    (typeof document !== "undefined"
      ? document.cookie
          .split("; ")
          .find((r) => r.startsWith("user_role="))
          ?.split("=")[1]
      : null) || "admin";
  const roleInitial = role.charAt(0).toUpperCase();

  return (
    <header
      className={cn(
        "h-14 border-b border-border bg-background/95 backdrop-blur-sm px-5 flex items-center justify-between shrink-0 sticky top-0 z-30",
        className,
      )}
      {...props}
    >
      {/* Left: Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <span key={crumb.href} className="flex items-center gap-1">
            {index > 0 && (
              <CaretRightIcon className="size-3 text-muted-foreground/50" />
            )}
            <span
              className={cn(
                crumb.isLast
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground hover:text-foreground cursor-pointer transition-colors",
              )}
              onClick={() => !crumb.isLast && router.push(crumb.href)}
            >
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>

      {/* Right: Actions + Notifications + Profile */}
      <div className="flex items-center gap-2">
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        {/* Notifications Dropdown */}
        <DropdownMenu
          open={notifOpen}
          onOpenChange={(o) => {
            setNotifOpen(o);
            if (o) fetchNotifications();
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full size-9"
            >
              <BellIcon className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center px-1 ring-2 ring-background">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div>
                <p className="text-sm font-semibold">Notifications</p>
                {unreadCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {unreadCount} unread
                  </p>
                )}
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 px-2 text-primary"
                  onClick={markAllRead}
                >
                  <CheckCircleIcon className="mr-1 size-3.5" />
                  Mark all read
                </Button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <BellIcon className="size-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No notifications yet
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      "px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors",
                      !notif.is_read && "bg-primary/5",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "text-sm leading-tight",
                            !notif.is_read ? "font-semibold" : "font-medium",
                          )}
                        >
                          {notif.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <span className="size-2 rounded-full bg-primary shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground/70 mt-1.5">
                      {format(new Date(notif.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative rounded-full size-9 p-0 hover:ring-2 hover:ring-primary/30 transition-all"
            >
              <div className="size-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold text-sm">
                {roleInitial}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-0.5">
                <p className="text-sm font-semibold capitalize">
                  {role} Account
                </p>
                <p className="text-xs text-muted-foreground">Signed in</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/admin/settings")}>
              <UserCircleIcon className="mr-2 size-4" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/admin/settings")}>
              <GearIcon className="mr-2 size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-rose-500 focus:text-rose-500 focus:bg-rose-500/10"
            >
              <SignOutIcon className="mr-2 size-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
