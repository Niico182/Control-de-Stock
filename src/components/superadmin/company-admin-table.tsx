"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type CompanyRow = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  enableSales: boolean;
  enableRentals: boolean;
  adminName: string;
  adminEmail: string;
  products: number;
  orders: number;
};

export function CompanyAdminTable({
  companies,
  onToggle,
}: {
  companies: CompanyRow[];
  onToggle: (id: string, isActive: boolean) => Promise<{ error?: string; success?: boolean }>;
}) {
  if (companies.length === 0) {
    return <p className="text-sm text-slate-500">Todavía no hay empresas registradas.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="px-3 py-2">Empresa</th>
            <th className="px-3 py-2">Admin</th>
            <th className="px-3 py-2">Módulos</th>
            <th className="px-3 py-2">Uso</th>
            <th className="px-3 py-2">Estado</th>
            <th className="px-3 py-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => (
            <tr key={company.id} className="border-b border-slate-100">
              <td className="px-3 py-3">
                <p className="font-medium">{company.name}</p>
                <p className="text-xs text-slate-500">{company.slug}</p>
              </td>
              <td className="px-3 py-3">
                <p>{company.adminName}</p>
                <p className="text-xs text-slate-500">{company.adminEmail}</p>
              </td>
              <td className="px-3 py-3">
                {company.enableSales ? <Badge>Ventas</Badge> : null}{" "}
                {company.enableRentals ? <Badge>Alquileres</Badge> : null}
              </td>
              <td className="px-3 py-3">
                {company.products} prod / {company.orders} ops
              </td>
              <td className="px-3 py-3">
                {company.isActive ? (
                  <Badge variant="success">Activa</Badge>
                ) : (
                  <Badge variant="danger">Suspendida</Badge>
                )}
              </td>
              <td className="px-3 py-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await onToggle(company.id, !company.isActive);
                    window.location.reload();
                  }}
                >
                  {company.isActive ? "Suspender" : "Activar"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
