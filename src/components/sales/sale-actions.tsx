"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";

export function SaleActions({
  saleId,
  onComplete,
  onCancel,
}: {
  saleId: string;
  onComplete: (id: string) => Promise<{ error?: string; success?: boolean }>;
  onCancel: (id: string) => Promise<{ error?: string; success?: boolean }>;
}) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await onComplete(saleId);
              window.location.reload();
            })
          }
        >
          Completar
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => setCancelOpen(true)}
        >
          Cancelar
        </Button>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        title="¿Cancelar esta preventa?"
        description="El stock reservado volverá a estar disponible. La venta quedará marcada como cancelada y esta acción no se puede deshacer."
        confirmLabel="Sí, cancelar venta"
        cancelLabel="No, volver"
        isPending={isPending}
        onClose={() => setCancelOpen(false)}
        onConfirm={() =>
          startTransition(async () => {
            await onCancel(saleId);
            setCancelOpen(false);
            window.location.reload();
          })
        }
      />
    </>
  );
}
