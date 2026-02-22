import { Badge } from "./badge";
import { cn } from "@/lib/utils";

interface QuickFilter {
  label: string;
  value: string;
  count?: number;
}

interface QuickFiltersProps {
  filters: QuickFilter[];
  activeFilter: string;
  onFilterChange: (value: string) => void;
}

export function QuickFilters({
  filters,
  activeFilter,
  onFilterChange,
}: QuickFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={cn(
            "px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all",
            activeFilter === filter.value
              ? "border-primary bg-primary/5 text-primary"
              : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
          )}
        >
          {filter.label}
          {filter.count !== undefined && (
            <Badge
              variant="secondary"
              className="ml-2 text-xs"
            >
              {filter.count}
            </Badge>
          )}
        </button>
      ))}
    </div>
  );
}
