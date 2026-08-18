import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { buildSortHref, type SortDirection } from "@/lib/sorting";
import { cn } from "@/lib/utils";

type SortableTableHeadProps = {
  label: string;
  column: string;
  currentSort: string;
  currentDir: SortDirection;
  basePath: string;
  preservedParams?: Record<string, string | undefined>;
  className?: string;
};

export function SortableTableHead({
  label,
  column,
  currentSort,
  currentDir,
  basePath,
  preservedParams = {},
  className,
}: SortableTableHeadProps) {
  const isActive = currentSort === column;

  return (
    <th className={cn("px-3 py-2", className)}>
      <Link
        href={buildSortHref(basePath, column, currentSort, currentDir, preservedParams)}
        className={cn(
          "inline-flex items-center gap-1 font-medium transition-colors hover:text-slate-900",
          isActive ? "text-slate-900" : "text-slate-500",
        )}
      >
        <span>{label}</span>
        {isActive ? (
          currentDir === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" aria-hidden />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden />
        )}
      </Link>
    </th>
  );
}
