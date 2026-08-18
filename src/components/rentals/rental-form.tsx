"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRentalAction } from "@/lib/actions/rental-actions";
import {
  buildOrderItems,
  createInitialOrderItems,
  OrderItemsEditor,
  type ProductOption,
} from "@/components/orders/order-product-picker";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

export function RentalForm({ products }: { products: ProductOption[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [rows, setRows] = useState(() => createInitialOrderItems(products));

  const items = useMemo(() => buildOrderItems(products, rows), [products, rows]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [items],
  );

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();

        if (items.length === 0) {
          setError("Agregá al menos un ítem al pedido.");
          return;
        }

        const formData = new FormData(event.currentTarget);
        formData.set("items", JSON.stringify(items));

        startTransition(async () => {
          const result = await createRentalAction(formData);
          if (result.error) {
            setError(result.error);
            return;
          }

          router.push("/dashboard/rentals");
          router.refresh();
        });
      }}
    >
      <div>
        <Label htmlFor="clientName">Cliente</Label>
        <Input id="clientName" name="clientName" required />
      </div>
      <div>
        <Label htmlFor="address">Dirección</Label>
        <Input id="address" name="address" required />
      </div>
      <div>
        <Label htmlFor="rentalDate">Fecha</Label>
        <DateInput id="rentalDate" name="rentalDate" required />
        <p className="mt-1 text-xs text-slate-500">
          Escribí la fecha o usá el ícono de calendario. Formato: DD/MM/AAAA
        </p>
      </div>

      <OrderItemsEditor products={products} items={rows} onChange={setRows} />

      <div>
        <Label htmlFor="notes">Notas</Label>
        <Input id="notes" name="notes" />
      </div>

      <p className="text-sm font-medium">Total: {formatCurrency(total)}</p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" disabled={isPending || products.length === 0}>
        {isPending ? "Creando..." : "Crear pedido"}
      </Button>
    </form>
  );
}
