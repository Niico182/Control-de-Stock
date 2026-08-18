"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProductAction } from "@/lib/actions/company-actions";
import type { ProductCatalogType } from "@/lib/products/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProductForm({
  productType,
  redirectHref,
}: {
  productType: ProductCatalogType;
  redirectHref: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        formData.set("type", productType);
        startTransition(async () => {
          const result = await createProductAction(formData);
          if (result.error) {
            setError(result.error);
            return;
          }

          router.push(redirectHref);
          router.refresh();
        });
      }}
      id="product-form"
      className="grid gap-4 md:grid-cols-2"
    >
      <input type="hidden" name="type" value={productType} />

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
      {error ? <p className="text-sm text-red-600 md:col-span-2">{error}</p> : null}
      <div className="md:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Crear producto"}
        </Button>
      </div>
    </form>
  );
}
