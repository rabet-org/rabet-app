"use client"

import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Sidebar, SidebarLink } from "@/components/layout/sidebar"
import { 
  SquaresFourIcon, 
  MagnifyingGlassIcon, 
  UserCheckIcon, 
  WalletIcon, 
  UserCircleIcon 
} from "@phosphor-icons/react"

const agencyLinks: SidebarLink[] = [
  {
    label: "Overview",
    href: "/agency",
    icon: SquaresFourIcon,
    category: "Dashboard",
    exactMatch: true
  },
  {
    label: "Browse Requests",
    href: "/agency/requests",
    icon: MagnifyingGlassIcon,
    category: "Leads"
  },
  {
    label: "My Leads",
    href: "/agency/leads",
    icon: UserCheckIcon,
    category: "Leads"
  },
  {
    label: "Wallet",
    href: "/agency/wallet",
    icon: WalletIcon,
    category: "Finance"
  },
  {
    label: "Profile",
    href: "/agency/profile",
    icon: UserCircleIcon,
    category: "Settings"
  }
]

export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      sidebar={<Sidebar links={agencyLinks} />}
    >
      {children}
    </DashboardShell>
  )
}
