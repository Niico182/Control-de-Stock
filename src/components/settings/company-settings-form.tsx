"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CompanySettingsForm({
  company,
  action,
}: {
  company: {
    name: string;
    enableSales: boolean;
    enableRentals: boolean;
  };
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          const result = await action(formData);
          setMessage(result.error ?? "Configuración guardada");
        });
      }}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="name">Nombre de la empresa</Label>
        <Input id="name" name="name" defaultValue={company.name} required />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="enableSales" defaultChecked={company.enableSales} />
        Habilitar ventas
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="enableRentals" defaultChecked={company.enableRentals} />
        Habilitar alquileres
      </label>

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}

      <Button type="submit" disabled={isPending}>
        Guardar cambios
      </Button>
    </form>
  );
}
