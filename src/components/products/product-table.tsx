"use client";

import { useState } from "react";
import { getAvailableQuantity, formatCurrency } from "@/lib/utils";
import { ProductEditDialog } from "@/components/products/product-edit-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { productTypeLabel } from "@/lib/products/catalog";
import type { SortDirection } from "@/lib/sorting";

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
  showType = false,
  sort,
  dir,
  basePath,
  preservedParams = {},
}: {
  products: ProductRow[];
  canManage: boolean;
  onDelete: (id: string) => Promise<{ error?: string; success?: boolean }>;
  showType?: boolean;
  sort: string;
  dir: SortDirection;
  basePath: string;
  preservedParams?: Record<string, string | undefined>;
}) {
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);

  if (products.length === 0) {
    return <p className="text-sm text-slate-500">No hay productos cargados.</p>;
  }

  const headProps = {
    currentSort: sort,
    currentDir: dir,
    basePath,
    preservedParams,
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <SortableTableHead label="Código" column="code" {...headProps} />
              <SortableTableHead label="Nombre" column="name" {...headProps} />
              <SortableTableHead label="Precio" column="price" {...headProps} />
              <SortableTableHead label="Total" column="quantityTotal" {...headProps} />
              <SortableTableHead label="Disponible" column="available" {...headProps} />
              <SortableTableHead label="Reservado" column="quantityReserved" {...headProps} />
              <SortableTableHead label="Alquilado" column="quantityRented" {...headProps} />
              {showType ? (
                <SortableTableHead label="Tipo" column="type" {...headProps} />
              ) : null}
              {canManage ? (
                <th className="px-3 py-2 text-slate-500">Acciones</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-slate-100">
                <td className="px-3 py-3 font-mono text-xs">{product.code}</td>
                <td className="px-3 py-3">{product.name}</td>
                <td className="px-3 py-3">{formatCurrency(product.price)}</td>
                <td className="px-3 py-3 font-medium">{product.quantityTotal}</td>
                <td className="px-3 py-3">{getAvailableQuantity(product)}</td>
                <td className="px-3 py-3">{product.quantityReserved}</td>
                <td className="px-3 py-3">{product.quantityRented}</td>
                {showType ? (
                  <td className="px-3 py-3">
                    <Badge>{productTypeLabel(product.type)}</Badge>
                  </td>
                ) : null}
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
