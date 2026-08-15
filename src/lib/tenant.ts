import type { Company } from "@/generated/prisma/client";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  permissionsFromMembership,
  type SessionPermissions,
} from "@/lib/permissions";
import { redirect } from "next/navigation";

type CompanyContext = {
  session: Session;
  permissions: SessionPermissions;
  company: Company;
  companyId: string;
};

export async function requireAuth(): Promise<Session> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session;
}

export async function requireSuperuser() {
  const session = await requireAuth();

  if (session.user.role !== "SUPERUSER") {
    redirect("/dashboard");
  }

  return session;
}

export async function getCompanyContext(): Promise<CompanyContext> {
  const session = await requireAuth();
  const permissions = session.user.permissions as SessionPermissions;

  if (session.user.role === "SUPERUSER") {
    redirect("/superadmin");
  }

  const activeCompanyId = permissions.companyId;

  if (!activeCompanyId) {
    redirect("/login");
  }

  const company = await prisma.company.findFirst({
    where: { id: activeCompanyId, isActive: true },
  });

  if (!company) {
    throw new Error("Empresa no encontrada o inactiva.");
  }

  return { session, permissions, company, companyId: activeCompanyId };
}

export async function loadMembership(userId: string, companyId: string) {
  return prisma.companyMember.findUnique({
    where: {
      userId_companyId: { userId, companyId },
    },
  });
}

export async function buildUserPermissions(userId: string, role: string) {
  if (role === "SUPERUSER") {
    return permissionsFromMembership("SUPERUSER");
  }

  const membership = await prisma.companyMember.findFirst({
    where: { userId },
  });

  return permissionsFromMembership(role as "ADMIN" | "EMPLOYEE", membership);
}
