import type { Metadata } from "next";
import { DashboardLayoutClient } from "@/components/layout/dashboard-layout-client";
import { requireSuperuser } from "@/lib/tenant";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  await requireSuperuser();

  return (
    <DashboardLayoutClient
      role="SUPERUSER"
      enableSales
      enableRentals
      sessionLabel="Plataforma"
      title="Superadministración"
    >
      {children}
    </DashboardLayoutClient>
  );
}
