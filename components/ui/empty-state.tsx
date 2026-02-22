import { ComponentType, ReactNode } from "react";
import { Button } from "./button";
import Link from "next/link";
import { Icon } from "@phosphor-icons/react";

interface EmptyStateProps {
  icon: Icon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 text-muted-foreground/30">
        <Icon className="size-16 mx-auto" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <>
          {action.href ? (
            <Link href={action.href}>
              <Button size="sm">{action.label}</Button>
            </Link>
          ) : (
            <Button onClick={action.onClick} size="sm">
              {action.label}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
