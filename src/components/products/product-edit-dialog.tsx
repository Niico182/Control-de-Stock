"use client";

import { useState, useTransition } from "react";
import { updateProductAction } from "@/lib/actions/company-actions";
import {
  ProductVariantEditor,
  createVariantDraft,
} from "@/components/products/product-variant-editor";
import { productTypeLabel } from "@/lib/products/catalog";
import type { ProductCategoryOption } from "@/lib/products/categories";
import { formatProductActiveStatus, getProductPriceLabel } from "@/lib/products/fields";
import {
  getVariantUnitPrice,
  parseVariantAttributes,
  type ProductVariantDraft,
} from "@/lib/products/variants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";
import type { ProductCatalogType } from "@/lib/products/catalog";

export type ProductEditData = {
  id: string;
  name: string;
  categoryId: string | null;
  description: string | null;
  basePrice: number;
  baseCost: number | null;
  type: ProductCatalogType;
  isActive: boolean;
  variants: Array<{
    id: string;
    sku: string;
    label: string;
    attributes: unknown;
    price: number | null;
    cost: number | null;
    quantityTotal: number;
    quantityReserved: number;
    quantityRented: number;
    isActive: boolean;
  }>;
};

export function ProductEditDialog({
  product,
  categories,
  onClose,
}: {
  product: ProductEditData;
  categories: ProductCategoryOption[];
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [variants, setVariants] = useState<ProductVariantDraft[]>(
    product.variants.map((variant) =>
      createVariantDraft({
        id: variant.id,
        color: parseVariantAttributes(variant.attributes).color ?? "",
        quantity: variant.quantityTotal,
        price: variant.price,
        cost: variant.cost,
        sku: variant.sku,
        isActive: variant.isActive,
      }),
    ),
  );
  const [isPending, startTransition] = useTransition();
  const priceLabel = getProductPriceLabel(product.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg dark:bg-slate-900 dark:shadow-none">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Editar producto</h3>
          <p className="text-sm text-slate-500">
            {product.variants.length} variación{product.variants.length === 1 ? "" : "es"}
          </p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            formData.set("productId", product.id);
            formData.set("variants", JSON.stringify(variants));

            startTransition(async () => {
              const result = await updateProductAction(formData);
              if (result.error) {
                setError(result.error);
                return;
              }

              onClose();
              window.location.reload();
            });
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor={`name-${product.id}`}>Nombre</Label>
              <Input
                id={`name-${product.id}`}
                name="name"
                defaultValue={product.name}
                required
              />
            </div>

            <div>
              <Label htmlFor={`categoryId-${product.id}`}>Categoría (opcional)</Label>
              <Select
                id={`categoryId-${product.id}`}
                name="categoryId"
                defaultValue={product.categoryId ?? ""}
              >
                <option value="">Sin categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor={`basePrice-${product.id}`}>{priceLabel} base</Label>
              <Input
                id={`basePrice-${product.id}`}
                name="basePrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product.basePrice}
                required
              />
            </div>

            <div>
              <Label htmlFor={`baseCost-${product.id}`}>Costo base (opcional)</Label>
              <Input
                id={`baseCost-${product.id}`}
                name="baseCost"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product.baseCost ?? ""}
              />
            </div>

            <div>
              <Label htmlFor={`isActive-${product.id}`}>Estado</Label>
              <Select
                id={`isActive-${product.id}`}
                name="isActive"
                defaultValue={product.isActive ? "true" : "false"}
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </Select>
              <p className="mt-1 text-xs text-slate-500">
                Estado actual: {formatProductActiveStatus(product.isActive)}
              </p>
            </div>

            <div>
              <Label>Tipo</Label>
              <p className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {productTypeLabel(product.type)}
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor={`description-${product.id}`}>Descripción (opcional)</Label>
            <textarea
              id={`description-${product.id}`}
              name="description"
              rows={3}
              defaultValue={product.description ?? ""}
              className={cn(
                "mt-1 flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-400 focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-600",
              )}
            />
          </div>

          <ProductVariantEditor
            variants={variants}
            onChange={setVariants}
            allowRemove={product.variants.length > 1}
          />

          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {product.variants.map((variant) => (
              <p key={variant.id}>
                {variant.label}: reservado {variant.quantityReserved}, alquilado{" "}
                {variant.quantityRented}, precio actual{" "}
                {formatCurrency(getVariantUnitPrice(variant, product))}
              </p>
            ))}
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
