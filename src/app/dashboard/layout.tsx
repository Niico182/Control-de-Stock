import type { Metadata } from "next";
import { DashboardNav } from "@/components/layout/dashboard-nav";
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
    <div className="flex min-h-screen">
      <DashboardNav
        role={session.user.role}
        enableSales={enableSales}
        enableRentals={enableRentals}
      />
      <main className="flex-1 overflow-auto">
        <div className="border-b border-slate-200 bg-white px-8 py-4">
          <p className="text-sm text-slate-500">Sesión: {session.user.name}</p>
          {company ? (
            <h1 className="text-xl font-semibold text-slate-900">{company.name}</h1>
          ) : null}
        </div>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
