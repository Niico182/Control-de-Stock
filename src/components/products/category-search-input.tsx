"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CategorySearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar categoría..."
        className="max-w-sm"
        aria-label="Buscar categorías por nombre"
      />
      {value ? (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange("")}>
          Limpiar
        </Button>
      ) : null}
    </div>
  );
}
