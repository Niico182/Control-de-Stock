"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateCompanyForm({
  action,
}: {
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          const result = await action(formData);
          setMessage(result.error ?? "Empresa creada correctamente");
          if (result.success) {
            (document.getElementById("create-company-form") as HTMLFormElement)?.reset();
          }
        });
      }}
      id="create-company-form"
      className="grid gap-4 md:grid-cols-2"
    >
      <div>
        <Label htmlFor="companyName">Nombre empresa</Label>
        <Input id="companyName" name="companyName" required />
      </div>
      <div>
        <Label htmlFor="adminName">Nombre admin</Label>
        <Input id="adminName" name="adminName" required />
      </div>
      <div>
        <Label htmlFor="adminEmail">Email admin</Label>
        <Input id="adminEmail" name="adminEmail" type="email" required />
      </div>
      <div>
        <Label htmlFor="adminPassword">Contraseña admin</Label>
        <Input id="adminPassword" name="adminPassword" type="password" required />
      </div>

      <label className="flex items-center gap-2 text-sm md:col-span-2">
        <input type="checkbox" name="enableSales" defaultChecked />
        Habilitar ventas
      </label>
      <label className="flex items-center gap-2 text-sm md:col-span-2">
        <input type="checkbox" name="enableRentals" defaultChecked />
        Habilitar alquileres
      </label>

      {message ? <p className="text-sm text-slate-600 md:col-span-2">{message}</p> : null}

      <div className="md:col-span-2">
        <Button type="submit" disabled={isPending}>
          Crear empresa
        </Button>
      </div>
    </form>
  );
}
