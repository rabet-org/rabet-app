"use client"

import { cn } from "@/lib/utils"

interface DashboardShellProps extends React.HTMLAttributes<HTMLDivElement> {
  sidebar: React.ReactNode
}

export function DashboardShell({ children, sidebar, className, ...props }: DashboardShellProps) {
  return (
    <div className={cn("flex h-screen overflow-hidden bg-background", className)} {...props}>
      {sidebar}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}
