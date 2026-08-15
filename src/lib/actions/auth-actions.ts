"use server";

import { signIn, auth } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData): Promise<{ error?: string } | void> {
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { error: "Credenciales inválidas" };
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Credenciales inválidas" };
    }

    throw error;
  }

  const session = await auth();
  const destination = session?.user?.role === "SUPERUSER" ? "/superadmin" : "/dashboard";
  redirect(destination);
}
