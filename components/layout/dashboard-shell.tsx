"use client";

import { cn } from "@/lib/utils";

interface DashboardShellProps extends React.HTMLAttributes<HTMLDivElement> {
  sidebar: React.ReactNode;
}

export function DashboardShell({
  children,
  sidebar,
  className,
  ...props
}: DashboardShellProps) {
  return (
    <div className={cn("min-h-screen bg-background", className)} {...props}>
      {/* Fixed sidebar */}
      <div className="fixed inset-y-0 left-0 z-40 w-64">{sidebar}</div>
      {/* Main area offset by sidebar width — natural page scroll */}
      <div className="ml-64 flex flex-col min-h-screen">{children}</div>
    </div>
  );
}
