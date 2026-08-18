import type { Metadata } from "next";
import { DashboardLayoutClient } from "@/components/layout/dashboard-layout-client";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/tenant";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();

  const membership = await prisma.companyMember.findFirst({
    where: { userId: session.user.id },
    include: { company: true },
  });

  const company = membership?.company;
  const enableSales = company?.enableSales ?? true;
  const enableRentals = company?.enableRentals ?? true;

  return (
    <DashboardLayoutClient
      role={session.user.role}
      enableSales={enableSales}
      enableRentals={enableRentals}
      sessionLabel={`Sesión: ${session.user.name}`}
      title={company?.name ?? "Panel"}
    >
      {children}
    </DashboardLayoutClient>
  );
}
