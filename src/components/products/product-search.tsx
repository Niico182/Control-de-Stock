"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SEARCH_DEBOUNCE_MS = 300;

export function ProductSearch({ defaultQuery = "" }: { defaultQuery?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);

  useEffect(() => {
    setQuery(defaultQuery);
  }, [defaultQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = query.trim();
      const params = new URLSearchParams(window.location.search);
      const currentQuery = (params.get("q") ?? "").trim();

      if (trimmed === currentQuery) {
        return;
      }

      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }

      params.delete("page");

      const nextQuery = params.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query, pathname, router]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar por nombre..."
        className="max-w-sm"
        aria-label="Buscar productos por nombre"
      />
      {query ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setQuery("")}
        >
          Limpiar
        </Button>
      ) : null}
    </div>
  );
}
