"use client";

import { useTransition } from "react";
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
  const [isPending, startTransition] = useTransition();

  return (
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
        onClick={() =>
          startTransition(async () => {
            await onCancel(saleId);
            window.location.reload();
          })
        }
      >
        Cancelar
      </Button>
    </div>
  );
}
