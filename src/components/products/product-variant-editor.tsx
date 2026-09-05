"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductVariantDraft } from "@/lib/products/variants";

function createVariantDraft(partial?: Partial<ProductVariantDraft>): ProductVariantDraft {
  return {
    color: partial?.color ?? "",
    quantity: partial?.quantity ?? 0,
    price: partial?.price ?? null,
    cost: partial?.cost ?? null,
    sku: partial?.sku ?? "",
    isActive: partial?.isActive ?? true,
    id: partial?.id,
  };
}

export function ProductVariantEditor({
  variants,
  onChange,
  allowRemove = true,
}: {
  variants: ProductVariantDraft[];
  onChange: (variants: ProductVariantDraft[]) => void;
  allowRemove?: boolean;
}) {
  function updateVariant(index: number, patch: Partial<ProductVariantDraft>) {
    onChange(variants.map((variant, current) => (current === index ? { ...variant, ...patch } : variant)));
  }

  function addVariant() {
    onChange([...variants, createVariantDraft()]);
  }

  function removeVariant(index: number) {
    if (variants.length === 1) return;
    onChange(variants.filter((_, current) => current !== index));
  }

  return (
    <div className="space-y-3 md:col-span-2">
      <div>
        <Label>Variaciones</Label>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Agregá una fila por color u otra variación. Si el producto no tiene variantes, dejá una
          sola fila sin color.
        </p>
      </div>

      <div className="space-y-3">
        {variants.map((variant, index) => (
          <div
            key={variant.id ?? `draft-${index}`}
            className="grid gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700 md:grid-cols-2 xl:grid-cols-5"
          >
            <div>
              <Label htmlFor={`variant-color-${index}`}>Color / variación</Label>
              <Input
                id={`variant-color-${index}`}
                value={variant.color ?? ""}
                placeholder={variants.length === 1 ? "Opcional" : "Ej. Blanco"}
                onChange={(event) => updateVariant(index, { color: event.target.value })}
              />
            </div>
            <div>
              <Label htmlFor={`variant-quantity-${index}`}>Stock</Label>
              <Input
                id={`variant-quantity-${index}`}
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={variant.quantity === 0 ? "" : String(variant.quantity)}
                onChange={(event) => {
                  const raw = event.target.value.replace(/\D/g, "");
                  updateVariant(index, {
                    quantity: raw === "" ? 0 : Number.parseInt(raw, 10),
                  });
                }}
              />
            </div>
            <div>
              <Label htmlFor={`variant-price-${index}`}>Precio propio</Label>
              <Input
                id={`variant-price-${index}`}
                type="number"
                step="0.01"
                min="0"
                value={variant.price ?? ""}
                placeholder="Usa precio base"
                onChange={(event) =>
                  updateVariant(index, {
                    price: event.target.value === "" ? null : Number(event.target.value),
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor={`variant-sku-${index}`}>SKU</Label>
              <Input
                id={`variant-sku-${index}`}
                value={variant.sku ?? ""}
                placeholder="Auto"
                className="font-mono uppercase"
                onChange={(event) => updateVariant(index, { sku: event.target.value })}
              />
            </div>
            <div className="flex items-end">
              {allowRemove && variants.length > 1 ? (
                <Button type="button" variant="outline" onClick={() => removeVariant(index)}>
                  Quitar
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={addVariant}>
        + Agregar variación
      </Button>
    </div>
  );
}

export { createVariantDraft };
