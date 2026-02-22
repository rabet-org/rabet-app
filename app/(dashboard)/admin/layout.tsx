"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Sidebar, SidebarLink } from "@/components/layout/sidebar";
import {
  SquaresFourIcon,
  UsersIcon,
  FileTextIcon,
  ReceiptIcon,
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
    label: "Finance",
    href: "/admin/finance",
    icon: ReceiptIcon,
    category: "Management",
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
