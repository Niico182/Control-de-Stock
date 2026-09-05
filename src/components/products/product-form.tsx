"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProductAction } from "@/lib/actions/company-actions";
import {
  ProductVariantEditor,
  createVariantDraft,
} from "@/components/products/product-variant-editor";
import type { ProductCatalogType } from "@/lib/products/catalog";
import type { ProductCategoryOption } from "@/lib/products/categories";
import type { ProductVariantDraft } from "@/lib/products/variants";
import { getProductPriceLabel } from "@/lib/products/fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function ProductForm({
  productType,
  redirectHref,
  categories,
}: {
  productType: ProductCatalogType;
  redirectHref: string;
  categories: ProductCategoryOption[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [variants, setVariants] = useState<ProductVariantDraft[]>([createVariantDraft()]);
  const [isPending, startTransition] = useTransition();
  const priceLabel = getProductPriceLabel(productType);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        formData.set("type", productType);
        formData.set("variants", JSON.stringify(variants));

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
        <Input id="name" name="name" required placeholder="Ej. Servilleta" />
      </div>
      <div>
        <Label htmlFor="categoryId">Categoría (opcional)</Label>
        <Select id="categoryId" name="categoryId" defaultValue="">
          <option value="">Sin categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="isActive">Estado (opcional)</Label>
        <Select id="isActive" name="isActive" defaultValue="true">
          <option value="true">Activo</option>
          <option value="false">Inactivo</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="basePrice">{priceLabel} base</Label>
        <Input id="basePrice" name="basePrice" type="number" step="0.01" min="0" required />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Se usa en variaciones que no tengan precio propio.
        </p>
      </div>
      <div>
        <Label htmlFor="baseCost">Costo base (opcional)</Label>
        <Input id="baseCost" name="baseCost" type="number" step="0.01" min="0" />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="description">Descripción (opcional)</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className={cn(
            "flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-400 focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-600",
          )}
          placeholder="Ej. Servilleta de tela para mantelería"
        />
      </div>

      <ProductVariantEditor variants={variants} onChange={setVariants} />

      {error ? <p className="text-sm text-red-600 md:col-span-2">{error}</p> : null}
      <div className="md:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Crear producto"}
        </Button>
      </div>
    </form>
  );
}
