import type { Metadata } from "next";
import { DashboardNav } from "@/components/layout/dashboard-nav";
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
    <div className="flex min-h-screen">
      <DashboardNav role="SUPERUSER" enableSales enableRentals />
      <main className="flex-1 overflow-auto">
        <div className="border-b border-slate-200 bg-white px-8 py-4">
          <p className="text-sm text-slate-500">Plataforma</p>
          <h1 className="text-xl font-semibold text-slate-900">Superadministración</h1>
        </div>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
