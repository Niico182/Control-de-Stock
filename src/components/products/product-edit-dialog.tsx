"use client";

import { useState, useTransition } from "react";
import { updateProductAction } from "@/lib/actions/company-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

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
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
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
            <Label htmlFor={`type-${product.id}`}>Tipo</Label>
            <Select id={`type-${product.id}`} name="type" defaultValue={product.type}>
              <option value="SALE">Solo venta</option>
              <option value="RENTAL">Solo alquiler</option>
              <option value="BOTH">Venta y alquiler</option>
            </Select>
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
