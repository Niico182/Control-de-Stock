"use client";

import { useState, useTransition } from "react";
import { createProductAction } from "@/lib/actions/company-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function ProductForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          const result = await createProductAction(formData);
          setError(result.error ?? null);
          if (result.success) {
            (document.getElementById("product-form") as HTMLFormElement)?.reset();
          }
        });
      }}
      id="product-form"
      className="grid gap-4 md:grid-cols-2"
    >
      <div>
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" required />
      </div>
      <div>
        <Label htmlFor="price">Precio</Label>
        <Input id="price" name="price" type="number" step="0.01" min="0" required />
      </div>
      <div>
        <Label htmlFor="quantity">Cantidad inicial</Label>
        <Input id="quantity" name="quantity" type="number" min="0" defaultValue="0" required />
      </div>
      <div>
        <Label htmlFor="type">Tipo</Label>
        <Select id="type" name="type" defaultValue="BOTH">
          <option value="SALE">Solo venta</option>
          <option value="RENTAL">Solo alquiler</option>
          <option value="BOTH">Venta y alquiler</option>
        </Select>
      </div>
      {error ? <p className="text-sm text-red-600 md:col-span-2">{error}</p> : null}
      <div className="md:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Crear producto"}
        </Button>
      </div>
    </form>
  );
}
