"use client";

import { useState } from "react";
import { getAvailableQuantity, formatCurrency } from "@/lib/utils";
import {
  ProductEditDialog,
  type ProductEditData,
} from "@/components/products/product-edit-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { productTypeLabel } from "@/lib/products/catalog";
import type { ProductCategoryOption } from "@/lib/products/categories";
import { formatProductActiveStatus } from "@/lib/products/fields";
import {
  DEFAULT_VARIANT_LABEL,
  formatVariantDisplayName,
} from "@/lib/products/variants";
import type { ProductCatalogType } from "@/lib/products/catalog";
import type { SortDirection } from "@/lib/sorting";

export type VariantTableRow = {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  variantLabel: string;
  categoryId: string | null;
  categoryName: string | null;
  description: string | null;
  basePrice: number;
  price: number;
  quantityTotal: number;
  quantityReserved: number;
  quantityRented: number;
  type: ProductCatalogType;
  isActive: boolean;
};

export function ProductTable({
  variants,
  categories,
  canManage,
  onDelete,
  onLoadProduct,
  showType = false,
  emptyMessage = "No hay productos cargados.",
  sort,
  dir,
  basePath,
  preservedParams = {},
}: {
  variants: VariantTableRow[];
  categories: ProductCategoryOption[];
  canManage: boolean;
  onDelete: (id: string) => Promise<{ error?: string; success?: boolean }>;
  onLoadProduct: (productId: string) => Promise<{ product?: ProductEditData; error?: string }>;
  showType?: boolean;
  emptyMessage?: string;
  sort: string;
  dir: SortDirection;
  basePath: string;
  preservedParams?: Record<string, string | undefined>;
}) {
  const [editingProduct, setEditingProduct] = useState<ProductEditData | null>(null);
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);

  if (variants.length === 0) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }

  const headProps = {
    currentSort: sort,
    currentDir: dir,
    basePath,
    preservedParams,
  };

  async function handleEdit(productId: string) {
    setLoadingEditId(productId);
    try {
      const result = await onLoadProduct(productId);
      if (result.product) {
        setEditingProduct(result.product);
      } else {
        window.alert(result.error ?? "No se pudo cargar el producto");
      }
    } finally {
      setLoadingEditId(null);
    }
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <SortableTableHead label="SKU" column="code" {...headProps} />
              <SortableTableHead label="Producto" column="name" {...headProps} />
              <SortableTableHead label="Variación" column="variant" {...headProps} />
              <SortableTableHead label="Categoría" column="category" {...headProps} />
              <SortableTableHead label="Precio" column="price" {...headProps} />
              <SortableTableHead label="Stock" column="quantityTotal" {...headProps} />
              <SortableTableHead label="Disponible" column="available" {...headProps} />
              <SortableTableHead label="Reservado" column="quantityReserved" {...headProps} />
              <SortableTableHead label="Alquilado" column="quantityRented" {...headProps} />
              <SortableTableHead label="Estado" column="isActive" {...headProps} />
              {showType ? (
                <SortableTableHead label="Tipo" column="type" {...headProps} />
              ) : null}
              {canManage ? (
                <th className="px-3 py-2 text-slate-500">Acciones</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {variants.map((variant) => (
              <tr key={variant.id} className="border-b border-slate-100">
                <td className="px-3 py-3 font-mono text-xs">{variant.sku}</td>
                <td className="px-3 py-3">
                  <div>{variant.productName}</div>
                  {variant.description ? (
                    <p className="mt-0.5 text-xs text-slate-500">{variant.description}</p>
                  ) : null}
                </td>
                <td className="px-3 py-3">
                  {variant.variantLabel === DEFAULT_VARIANT_LABEL ? "—" : variant.variantLabel}
                </td>
                <td className="px-3 py-3">{variant.categoryName ?? "—"}</td>
                <td className="px-3 py-3">{formatCurrency(variant.price)}</td>
                <td className="px-3 py-3 font-medium">{variant.quantityTotal}</td>
                <td className="px-3 py-3">{getAvailableQuantity(variant)}</td>
                <td className="px-3 py-3">{variant.quantityReserved}</td>
                <td className="px-3 py-3">{variant.quantityRented}</td>
                <td className="px-3 py-3">
                  <Badge variant={variant.isActive ? "success" : "default"}>
                    {formatProductActiveStatus(variant.isActive)}
                  </Badge>
                </td>
                {showType ? (
                  <td className="px-3 py-3">
                    <Badge>{productTypeLabel(variant.type)}</Badge>
                  </td>
                ) : null}
                {canManage ? (
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loadingEditId === variant.productId}
                        onClick={() => handleEdit(variant.productId)}
                      >
                        {loadingEditId === variant.productId ? "Cargando…" : "Editar"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          if (
                            confirm(
                              `¿Eliminar "${formatVariantDisplayName(variant.productName, variant.variantLabel)}" y todas sus variaciones?`,
                            )
                          ) {
                            await onDelete(variant.productId);
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
          categories={categories}
          onClose={() => setEditingProduct(null)}
        />
      ) : null}
    </>
  );
}
