"use client";

import { useMemo } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

export type ProductOption = {
  id: string;
  name: string;
  price: number;
  available: number;
};

export type OrderLineItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

type ItemRow = {
  key: string;
  productId: string;
  quantity: number;
};

type OrderItemsEditorProps = {
  products: ProductOption[];
  items: ItemRow[];
  onChange: (items: ItemRow[]) => void;
};

function createRow(productId = ""): ItemRow {
  return {
    key: crypto.randomUUID(),
    productId,
    quantity: 1,
  };
}

function isItemComplete(item: ItemRow, productMap: Map<string, ProductOption>) {
  if (!item.productId || item.quantity < 1) return false;
  return productMap.has(item.productId);
}

export function createInitialOrderItems(products: ProductOption[]): ItemRow[] {
  if (products.length === 0) return [];
  return [createRow()];
}

export function OrderItemsEditor({ products, items, onChange }: OrderItemsEditorProps) {
  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  if (products.length === 0) {
    return <p className="text-sm text-slate-500">No hay productos disponibles.</p>;
  }

  function updateItem(key: string, patch: Partial<Pick<ItemRow, "productId" | "quantity">>) {
    onChange(
      items.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }

  function removeItem(key: string) {
    if (items.length === 1) return;
    onChange(items.filter((item) => item.key !== key));
  }

  function addItem() {
    onChange([...items, createRow()]);
  }

  const canAddAnotherItem = items.length > 0 && items.every((item) => isItemComplete(item, productMap));

  return (
    <div className="space-y-3">
      <Label>Productos del pedido</Label>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-slate-500">
              <th className="px-3 py-2 font-medium">Producto</th>
              <th className="px-3 py-2 font-medium">Cantidad</th>
              <th className="px-3 py-2 font-medium">Precio unit.</th>
              <th className="px-3 py-2 font-medium">Subtotal</th>
              <th className="px-3 py-2 font-medium w-16" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const product = productMap.get(item.productId);
              const maxQuantity = product?.available ?? 1;
              const unitPrice = product?.price ?? 0;
              const subtotal = item.quantity * unitPrice;

              return (
                <tr key={item.key} className="border-t border-slate-100">
                  <td className="px-3 py-2 min-w-[220px]">
                    <Select
                      value={item.productId}
                      onChange={(event) =>
                        updateItem(item.key, { productId: event.target.value })
                      }
                    >
                      <option value="">Seleccionar producto...</option>
                      {products.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name} (disp: {option.available})
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={1}
                      max={maxQuantity}
                      value={item.quantity}
                      className="w-24"
                      onChange={(event) => {
                        const parsed = Number(event.target.value);
                        const safe = Number.isNaN(parsed)
                          ? 1
                          : Math.min(Math.max(1, parsed), maxQuantity);
                        updateItem(item.key, { quantity: safe });
                      }}
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {item.productId ? formatCurrency(unitPrice) : "—"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-medium">
                    {item.productId ? formatCurrency(subtotal) : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {items.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.key)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        aria-label="Quitar fila"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {canAddAnotherItem ? (
        <Button type="button" variant="outline" onClick={addItem}>
          + Agregar otro ítem
        </Button>
      ) : null}

      <p className="text-xs text-slate-500">
        Completá la fila actual para poder agregar otra debajo.
      </p>
    </div>
  );
}

export function buildOrderItems(
  products: ProductOption[],
  rows: ItemRow[],
): OrderLineItem[] {
  const productMap = new Map(products.map((product) => [product.id, product]));
  const merged = new Map<string, OrderLineItem>();

  for (const row of rows) {
    if (!row.productId || row.quantity <= 0) continue;

    const product = productMap.get(row.productId);
    if (!product) continue;

    const existing = merged.get(row.productId);

    if (existing) {
      existing.quantity += row.quantity;
    } else {
      merged.set(row.productId, {
        productId: row.productId,
        quantity: row.quantity,
        unitPrice: product.price,
      });
    }
  }

  return Array.from(merged.values());
}

export type { ItemRow };
