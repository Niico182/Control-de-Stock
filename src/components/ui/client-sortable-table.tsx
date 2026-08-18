"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { getNextSortDirection, sortRows, type SortDirection } from "@/lib/sorting";
import { cn } from "@/lib/utils";

type ClientSortColumn<T> = {
  key: string;
  label: string;
  getValue: (row: T) => string | number;
  className?: string;
};

export function ClientSortableTable<T extends { id: string }>({
  columns,
  rows,
  defaultSort,
  renderRow,
  emptyMessage = "No hay datos.",
}: {
  columns: ClientSortColumn<T>[];
  rows: T[];
  defaultSort: string;
  renderRow: (row: T) => React.ReactNode;
  emptyMessage?: string;
}) {
  const [sort, setSort] = useState(defaultSort);
  const [dir, setDir] = useState<SortDirection>("asc");

  const getters = useMemo(
    () =>
      Object.fromEntries(columns.map((column) => [column.key, column.getValue])),
    [columns],
  );

  const sortedRows = useMemo(
    () => sortRows(rows, sort, dir, getters),
    [rows, sort, dir, getters],
  );

  function handleSort(column: string) {
    setSort((prevSort) => {
      setDir((prevDir) => getNextSortDirection(prevSort, prevDir, column));
      return column;
    });
  }

  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            {columns.map((column) => {
              const isActive = sort === column.key;

              return (
                <th key={column.key} className={cn("px-3 py-2", column.className)}>
                  <button
                    type="button"
                    onClick={() => handleSort(column.key)}
                    className={cn(
                      "inline-flex items-center gap-1 font-medium transition-colors hover:text-slate-900",
                      isActive ? "text-slate-900" : "text-slate-500",
                    )}
                  >
                    <span>{column.label}</span>
                    {isActive ? (
                      dir === "asc" ? (
                        <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                      )
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden />
                    )}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>{sortedRows.map((row) => renderRow(row))}</tbody>
      </table>
    </div>
  );
}
