"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { loginAction } from "@/lib/actions/auth-actions";
import {
  clearRememberedEmail,
  getRememberedEmail,
  saveRememberedEmail,
} from "@/lib/remember-account";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [rememberAccount, setRememberAccount] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const savedEmail = getRememberedEmail();
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberAccount(true);
    }
  }, []);

  return (
    <Card className="w-full max-w-md">
      <CardHeader
        title="Iniciar sesión"
        description="Accedé a tu panel de control de stock"
      />
      <form
        action={(formData) => {
          const submittedEmail = String(formData.get("email"));

          if (rememberAccount) {
            saveRememberedEmail(submittedEmail);
          } else {
            clearRememberedEmail();
          }

          startTransition(async () => {
            const result = await loginAction(formData);
            if (result?.error) {
              setError(result.error);
            }
          });
        }}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </div>
        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete={rememberAccount ? "current-password" : "off"}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={rememberAccount}
            onChange={(event) => setRememberAccount(event.target.checked)}
          />
          Recordar cuenta
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Ingresando..." : "Entrar"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        <Link href="/" className="underline">
          Volver al inicio
        </Link>
      </p>
    </Card>
  );
}
