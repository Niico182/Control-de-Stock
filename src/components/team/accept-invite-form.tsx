"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { acceptInviteAction } from "@/lib/actions/company-actions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AcceptInviteForm({ token }: { token: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader title="Aceptar invitación" description="Creá tu cuenta de empleado" />
        <form
          action={(formData) => {
            formData.set("token", token);
            startTransition(async () => {
              const result = await acceptInviteAction(formData);
              setMessage(result.error ?? "Cuenta creada. Ya podés iniciar sesión.");
            });
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="name">Nombre completo</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {message ? <p className="text-sm text-slate-600">{message}</p> : null}
          <Button type="submit" disabled={isPending} className="w-full">
            Crear cuenta
          </Button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="underline">
            Ir al login
          </Link>
        </p>
      </Card>
    </div>
  );
}
