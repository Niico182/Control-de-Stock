"use client";

import { ClientSortableTable } from "@/components/ui/client-sortable-table";
import { formatCurrency } from "@/lib/utils";

type RentalItemRow = {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

type RentalReturnItemRow = {
  id: string;
  productName: string;
  quantityReturned: number;
  quantityMissing: number;
};

export function RentalItemsTable({
  items,
  currency,
}: {
  items: RentalItemRow[];
  currency: string;
}) {
  return (
    <ClientSortableTable
      columns={[
        { key: "productName", label: "Producto", getValue: (row) => row.productName },
        { key: "quantity", label: "Cantidad", getValue: (row) => row.quantity },
        { key: "unitPrice", label: "Precio unit.", getValue: (row) => row.unitPrice },
        { key: "subtotal", label: "Subtotal", getValue: (row) => row.subtotal },
      ]}
      rows={items}
      defaultSort="productName"
      renderRow={(item) => (
        <tr key={item.id} className="border-b border-slate-100">
          <td className="px-3 py-3">{item.productName}</td>
          <td className="px-3 py-3">{item.quantity}</td>
          <td className="px-3 py-3">{formatCurrency(item.unitPrice, currency)}</td>
          <td className="px-3 py-3">{formatCurrency(item.subtotal, currency)}</td>
        </tr>
      )}
    />
  );
}

export function RentalReturnItemsTable({ items }: { items: RentalReturnItemRow[] }) {
  return (
    <ClientSortableTable
      columns={[
        { key: "productName", label: "Producto", getValue: (row) => row.productName },
        {
          key: "quantityReturned",
          label: "Devueltas",
          getValue: (row) => row.quantityReturned,
        },
        {
          key: "quantityMissing",
          label: "Faltantes",
          getValue: (row) => row.quantityMissing,
        },
      ]}
      rows={items}
      defaultSort="productName"
      renderRow={(item) => (
        <tr key={item.id} className="border-b border-slate-100">
          <td className="px-3 py-3">{item.productName}</td>
          <td className="px-3 py-3">{item.quantityReturned}</td>
          <td className="px-3 py-3">{item.quantityMissing}</td>
        </tr>
      )}
    />
  );
}
