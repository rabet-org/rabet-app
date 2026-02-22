"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Sidebar, SidebarLink } from "@/components/layout/sidebar";
import {
  SquaresFourIcon,
  MagnifyingGlassIcon,
  UserCheckIcon,
  WalletIcon,
  UserCircleIcon,
  CalendarCheckIcon,
  UsersIcon,
  BuildingsIcon,
  ChatCircleTextIcon,
  GearIcon,
} from "@phosphor-icons/react";

const providerLinks: SidebarLink[] = [
  {
    label: "Overview",
    href: "/provider",
    icon: SquaresFourIcon,
    category: "Dashboard",
    exactMatch: true,
  },
  {
    label: "Active Requests",
    href: "/provider/requests",
    icon: CalendarCheckIcon,
    category: "Work",
  },
  {
    label: "Lead Board",
    href: "/provider/leads",
    icon: UsersIcon,
    category: "Work",
  },
  {
    label: "Wallet",
    href: "/provider/wallet",
    icon: WalletIcon,
    category: "Finance",
  },
  {
    label: "My Profile",
    href: "/provider/profile",
    icon: BuildingsIcon,
    category: "Settings",
  },
  {
    label: "Messages",
    href: "/provider/messages",
    icon: ChatCircleTextIcon,
    category: "Settings",
  },
  {
    label: "Settings",
    href: "/provider/settings",
    icon: GearIcon,
    category: "Settings",
  },
];

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell sidebar={<Sidebar links={providerLinks} />}>
      {children}
    </DashboardShell>
  );
}
