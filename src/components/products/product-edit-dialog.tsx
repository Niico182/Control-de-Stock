"use client";

import { useState, useTransition } from "react";
import { updateProductAction } from "@/lib/actions/company-actions";
import { productTypeLabel } from "@/lib/products/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProductRow = {
  id: string;
  code: string;
  name: string;
  price: number;
  quantityTotal: number;
  quantityReserved: number;
  quantityRented: number;
  type: string;
};

export function ProductEditDialog({
  product,
  onClose,
}: {
  product: ProductRow;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const minQuantity = product.quantityReserved + product.quantityRented;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg dark:bg-slate-900 dark:shadow-none">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Editar producto</h3>
          <p className="text-sm text-slate-500">Código: {product.code}</p>
        </div>

        <form
          action={(formData) => {
            formData.set("productId", product.id);
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
            <Label htmlFor={`price-${product.id}`}>Precio</Label>
            <Input
              id={`price-${product.id}`}
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={product.price}
              required
            />
          </div>

          <div>
            <Label htmlFor={`quantity-${product.id}`}>Cantidad total</Label>
            <Input
              id={`quantity-${product.id}`}
              name="quantity"
              type="number"
              min={minQuantity}
              defaultValue={product.quantityTotal}
              required
            />
            {minQuantity > 0 ? (
              <p className="mt-1 text-xs text-slate-500">
                Mínimo permitido: {minQuantity} (reservado + alquilado)
              </p>
            ) : null}
          </div>

          <div>
            <Label>Tipo</Label>
            <p className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {productTypeLabel(product.type)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              El tipo no se puede cambiar. Creá un producto nuevo en el otro catálogo si lo necesitás.
            </p>
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
