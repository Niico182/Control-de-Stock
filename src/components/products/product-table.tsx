"use client";

import { useState } from "react";
import { getAvailableQuantity, formatCurrency } from "@/lib/utils";
import { ProductEditDialog } from "@/components/products/product-edit-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

export function ProductTable({
  products,
  canManage,
  onDelete,
}: {
  products: ProductRow[];
  canManage: boolean;
  onDelete: (id: string) => Promise<{ error?: string; success?: boolean }>;
}) {
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);

  if (products.length === 0) {
    return <p className="text-sm text-slate-500">No hay productos cargados.</p>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-3 py-2">Código</th>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Precio</th>
              <th className="px-3 py-2">Disponible</th>
              <th className="px-3 py-2">Reservado</th>
              <th className="px-3 py-2">Alquilado</th>
              <th className="px-3 py-2">Tipo</th>
              {canManage ? <th className="px-3 py-2">Acciones</th> : null}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-slate-100">
                <td className="px-3 py-3 font-mono text-xs">{product.code}</td>
                <td className="px-3 py-3">{product.name}</td>
                <td className="px-3 py-3">{formatCurrency(product.price)}</td>
                <td className="px-3 py-3">{getAvailableQuantity(product)}</td>
                <td className="px-3 py-3">{product.quantityReserved}</td>
                <td className="px-3 py-3">{product.quantityRented}</td>
                <td className="px-3 py-3">
                  <Badge>{product.type}</Badge>
                </td>
                {canManage ? (
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingProduct(product)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          if (confirm("¿Eliminar producto?")) {
                            await onDelete(product.id);
                            window.location.reload();
                          }
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingProduct ? (
        <ProductEditDialog
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      ) : null}
    </>
  );
}
