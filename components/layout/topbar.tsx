"use client";

import { cn } from "@/lib/utils";

interface TopbarProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

export function Topbar({
  title,
  description,
  actions,
  className,
  ...props
}: TopbarProps) {
  return (
    <header
      className={cn(
        "h-14 border-b border-border bg-background px-6 flex items-center justify-between shrink-0",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col justify-center">
        {title && (
          <h1 className="text-sm font-semibold leading-none">{title}</h1>
        )}
      </div>
      <div className="flex items-center gap-4">{actions}</div>
    </header>
  );
}
