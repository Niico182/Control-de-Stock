"use client";

import { useState, useTransition } from "react";
import { returnRentalAction } from "@/lib/actions/rental-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RentalItem = {
  productId: string;
  productName: string;
  quantity: number;
};

export function RentalActions({
  rentalId,
  status,
  items,
  canManage,
  onCancel,
}: {
  rentalId: string;
  status: string;
  items: RentalItem[];
  canManage: boolean;
  onCancel: (id: string) => Promise<{ error?: string; success?: boolean }>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [returnItems, setReturnItems] = useState(
    items.map((item) => ({
      productId: item.productId,
      quantityReturned: item.quantity,
      quantityMissing: 0,
    })),
  );

  if (!canManage) {
    return (
      <a
        href={`/api/rentals/${rentalId}/pdf`}
        target="_blank"
        rel="noreferrer"
        className="text-sm text-blue-600 underline"
      >
        PDF
      </a>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`/api/rentals/${rentalId}/pdf`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-8 items-center rounded-lg border border-slate-300 px-3 text-sm"
      >
        PDF
      </a>

      {status === "ACTIVE" ? (
        <>
          <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
            Devolver
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await onCancel(rentalId);
                window.location.reload();
              })
            }
          >
            Cancelar
          </Button>
        </>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6">
            <h3 className="text-lg font-semibold">Registrar devolución</h3>
            <p className="mt-1 text-sm text-slate-500">
              Indicá cuántas unidades se devolvieron y cuántas faltan.
            </p>

            <form
              className="mt-4 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                formData.set("rentalOrderId", rentalId);
                formData.set("items", JSON.stringify(returnItems));

                startTransition(async () => {
                  const result = await returnRentalAction(formData);
                  if (!result.error) {
                    setOpen(false);
                    window.location.reload();
                  }
                });
              }}
            >
              {items.map((item, index) => (
                <div key={item.productId} className="rounded-lg border border-slate-200 p-3">
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-xs text-slate-500">Alquiladas: {item.quantity}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <Label>Devueltas</Label>
                      <Input
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={returnItems[index]?.quantityReturned ?? 0}
                        onChange={(event) =>
                          setReturnItems((current) =>
                            current.map((row, i) =>
                              i === index
                                ? { ...row, quantityReturned: Number(event.target.value) }
                                : row,
                            ),
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label>Faltantes</Label>
                      <Input
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={returnItems[index]?.quantityMissing ?? 0}
                        onChange={(event) =>
                          setReturnItems((current) =>
                            current.map((row, i) =>
                              i === index
                                ? { ...row, quantityMissing: Number(event.target.value) }
                                : row,
                            ),
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div>
                <Label htmlFor="notes">Notas</Label>
                <Input id="notes" name="notes" />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cerrar
                </Button>
                <Button type="submit" disabled={isPending}>
                  Confirmar devolución
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
