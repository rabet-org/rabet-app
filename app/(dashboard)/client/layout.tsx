"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Sidebar, SidebarLink } from "@/components/layout/sidebar";
import {
  SquaresFourIcon,
  CalendarPlusIcon,
  BrowsersIcon,
  ChatCircleTextIcon,
  GearIcon,
} from "@phosphor-icons/react";

const clientLinks: SidebarLink[] = [
  {
    label: "Overview",
    href: "/client",
    icon: SquaresFourIcon,
    category: "Dashboard",
    exactMatch: true,
  },
  {
    label: "My Requests",
    href: "/client/requests",
    icon: BrowsersIcon,
    category: "Activity",
  },
  {
    label: "Post a Request",
    href: "/client/requests/new",
    icon: CalendarPlusIcon,
    category: "Activity",
  },
  {
    label: "Messages",
    href: "/client/messages",
    icon: ChatCircleTextIcon,
    category: "Account",
  },
  {
    label: "Settings",
    href: "/client/settings",
    icon: GearIcon,
    category: "Account",
  },
];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell sidebar={<Sidebar links={clientLinks} />}>
      {children}
    </DashboardShell>
  );
}
