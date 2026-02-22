"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Sidebar, SidebarLink } from "@/components/layout/sidebar";
import {
  SquaresFourIcon,
  UsersIcon,
  FileTextIcon,
  ClipboardTextIcon,
  TagIcon,
  BuildingsIcon,
  ListChecksIcon,
  StarIcon,
  Coins,
  Receipt,
  ArrowCounterClockwise,
  ShieldCheckIcon,
  BellIcon,
  GearIcon,
  ChatCircleTextIcon,
  DownloadIcon,
  PaperPlaneIcon,
} from "@phosphor-icons/react";

const adminLinks: SidebarLink[] = [
  {
    label: "Overview",
    href: "/admin",
    icon: SquaresFourIcon,
    category: "Dashboard",
    exactMatch: true,
  },
  {
    label: "Applications",
    href: "/admin/applications",
    icon: FileTextIcon,
    category: "Management",
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: UsersIcon,
    category: "Management",
  },
  {
    label: "Providers",
    href: "/admin/providers",
    icon: BuildingsIcon,
    category: "Management",
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: TagIcon,
    category: "Content",
  },
  {
    label: "Requests",
    href: "/admin/requests",
    icon: ListChecksIcon,
    category: "Content",
  },
  {
    label: "Reviews",
    href: "/admin/reviews",
    icon: StarIcon,
    category: "Content",
  },
  {
    label: "Financials",
    icon: Coins,
    category: "System",
    children: [
      {
        label: "Ledger",
        href: "/admin/financials/ledger",
        icon: Receipt,
        exactMatch: true,
      },
      {
        label: "Refunds",
        href: "/admin/financials/refunds",
        icon: ArrowCounterClockwise,
      },
    ],
  },
  {
    label: "Audit Logs",
    href: "/admin/logs",
    icon: ClipboardTextIcon,
    category: "System",
  },
  {
    label: "Admin Team",
    href: "/admin/team",
    icon: ShieldCheckIcon,
    category: "System",
  },
  {
    label: "Platform Settings",
    href: "/admin/platform-settings",
    icon: GearIcon,
    category: "System",
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    icon: BellIcon,
    category: "System",
  },
  {
    label: "Support Tickets",
    href: "/admin/support",
    icon: ChatCircleTextIcon,
    category: "System",
  },
  {
    label: "Broadcast Messages",
    href: "/admin/messages",
    icon: PaperPlaneIcon,
    category: "System",
  },
  {
    label: "Export Data",
    href: "/admin/exports",
    icon: DownloadIcon,
    category: "System",
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell sidebar={<Sidebar links={adminLinks} />}>
      {children}
    </DashboardShell>
  );
}
