"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuickFilters } from "@/components/ui/quick-filters";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  InfoIcon,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { useAlertHelpers } from "@/components/ui/alert-toast";
import { EmptyState } from "@/components/ui/empty-state";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: Date;
  metadata: any;
};

export function NotificationsClient() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const { success } = useAlertHelpers();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/users/me/notifications");
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.data || []);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "read") return n.is_read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
      });

      if (res.ok) {
        setNotifications(
          notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });

      if (res.ok) {
        setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
        success("All notifications marked as read");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setNotifications(notifications.filter((n) => n.id !== id));
        success("Notification deleted");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "email_verified":
      case "application_approved":
        return <CheckCircleIcon className="size-5 text-emerald-500" weight="fill" />;
      case "application_rejected":
      case "low_wallet_balance":
        return <WarningCircleIcon className="size-5 text-amber-500" weight="fill" />;
      case "admin_message":
        return <EnvelopeIcon className="size-5 text-blue-500" weight="fill" />;
      default:
        return <InfoIcon className="size-5 text-primary" weight="fill" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Notifications</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Stay updated with your activity
          </p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-16 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Notifications</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Stay updated with your activity
          </p>
        </div>
        <EmptyState
          icon={BellIcon}
          title="No notifications"
          description="You're all caught up! No new notifications"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Notifications</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline">
            <CheckIcon className="mr-2 size-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      <QuickFilters
        filters={[
          { label: "All", value: "all", count: notifications.length },
          { label: "Unread", value: "unread", count: unreadCount },
          {
            label: "Read",
            value: "read",
            count: notifications.length - unreadCount,
          },
        ]}
        activeFilter={filter}
        onFilterChange={(value) => setFilter(value as any)}
      />

      <div className="space-y-3">
        {filteredNotifications.map((notification) => (
          <Card
            key={notification.id}
            className={`p-4 transition-all ${
              !notification.is_read
                ? "bg-primary/5 border-primary/20"
                : "hover:bg-muted/30"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-1">
                  <h3 className="font-semibold">{notification.title}</h3>
                  {!notification.is_read && (
                    <Badge variant="secondary" className="text-xs">
                      New
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {notification.message}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(notification.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                  <div className="flex gap-2">
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <CheckIcon className="size-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(notification.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <TrashIcon className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredNotifications.length === 0 && (
        <Card className="p-12 text-center">
          <BellIcon className="size-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No notifications</h3>
          <p className="text-muted-foreground">
            {filter === "unread"
              ? "You have no unread notifications"
              : "No notifications in this category"}
          </p>
        </Card>
      )}
    </div>
  );
}
