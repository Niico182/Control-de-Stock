"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const filters = [
  { value: "ALL", label: "Todos" },
  { value: "ACTIVE", label: "Activos" },
  { value: "RETURNED", label: "Devueltos" },
  { value: "CANCELLED", label: "Cancelados" },
];

export function RentalStatusFilter({ current }: { current: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function setFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    params.delete("page");

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter.value}
          type="button"
          onClick={() => setFilter(filter.value)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            current === filter.value
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200",
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

export function RentalViewLink({ rentalId }: { rentalId: string }) {
  return (
    <Link
      href={`/dashboard/rentals/${rentalId}`}
      className="inline-flex h-8 items-center rounded-lg border border-slate-300 px-3 text-sm font-medium hover:bg-slate-50"
    >
      Ver
    </Link>
  );
}
