"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface SidebarLink {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  category?: string;
  exactMatch?: boolean;
}

interface SidebarProps {
  links: SidebarLink[];
  className?: string;
}

export function Sidebar({ links, className }: SidebarProps) {
  const pathname = usePathname();

  // Group links by category
  const groupedLinks = links.reduce(
    (acc, link) => {
      const category = link.category || "Main";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(link);
      return acc;
    },
    {} as Record<string, SidebarLink[]>,
  );

  return (
    <aside
      className={cn(
        "w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground hidden md:flex flex-col h-full",
        className,
      )}
    >
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
        <div className="font-bold text-lg tracking-tight">Rabet</div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {Object.entries(groupedLinks).map(([category, categoryLinks]) => (
          <div key={category} className="mb-6 px-3">
            {Object.keys(groupedLinks).length > 1 && (
              <h3 className="mb-2 px-4 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
                {category}
              </h3>
            )}
            <nav className="space-y-1">
              {categoryLinks.map((link) => {
                const isActive = link.exactMatch
                  ? pathname === link.href
                  : pathname === link.href ||
                    pathname.startsWith(`${link.href}/`);
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground text-sidebar-foreground/80",
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}
