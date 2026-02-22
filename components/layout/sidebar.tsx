"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CaretDown } from "@phosphor-icons/react";

export interface SidebarLink {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  category?: string;
  exactMatch?: boolean;
  children?: SidebarLink[];
}

interface SidebarProps {
  links: SidebarLink[];
  className?: string;
}

function CollapsibleLink({
  link,
  pathname,
}: {
  link: SidebarLink;
  pathname: string;
}) {
  const isChildActive =
    link.children?.some((child) =>
      child.href
        ? child.exactMatch
          ? pathname === child.href
          : pathname === child.href || pathname.startsWith(`${child.href}/`)
        : false,
    ) ?? false;

  const [isOpen, setIsOpen] = useState(isChildActive);
  const Icon = link.icon;

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
          isChildActive
            ? "text-sidebar-accent-foreground"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
        )}
      >
        <Icon className="w-5 h-5 shrink-0" />
        {link.label}
        <CaretDown
          className={cn(
            "ml-auto size-4 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>
      {isOpen && (
        <div className="mt-1 ml-3 pl-3 border-l border-sidebar-border space-y-0.5">
          {link.children?.map((child) => {
            if (!child.href) return null;
            const isActive = child.exactMatch
              ? pathname === child.href
              : pathname === child.href ||
                pathname.startsWith(`${child.href}/`);
            const ChildIcon = child.icon;
            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground text-sidebar-foreground/70",
                )}
              >
                <ChildIcon className="w-4 h-4 shrink-0" />
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
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
                if (link.children) {
                  return (
                    <CollapsibleLink
                      key={link.label}
                      link={link}
                      pathname={pathname}
                    />
                  );
                }

                const isActive = link.href
                  ? link.exactMatch
                    ? pathname === link.href
                    : pathname === link.href ||
                      pathname.startsWith(`${link.href}/`)
                  : false;
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href ?? link.label}
                    href={link.href!}
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
