"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InviteForm({
  action,
}: {
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean; inviteUrl?: string }>;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          const result = await action(formData);
          setMessage(result.error ?? "Invitación creada");
          setInviteUrl(result.inviteUrl ?? null);
        });
      }}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="email">Email del empleado</Label>
        <Input id="email" name="email" type="email" required />
      </div>

      <div className="grid gap-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="canManageProducts" />
          Gestionar productos
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="canCreateOrders" defaultChecked />
          Crear pedidos/ventas
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="canViewReports" />
          Ver reportes
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="canManageMembers" />
          Gestionar equipo
        </label>
      </div>

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      {inviteUrl ? (
        <p className="break-all text-sm text-blue-600">Link: {inviteUrl}</p>
      ) : null}

      <Button type="submit" disabled={isPending}>
        Generar invitación
      </Button>
    </form>
  );
}
