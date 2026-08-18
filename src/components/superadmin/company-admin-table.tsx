"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import type { SortDirection } from "@/lib/sorting";

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
  sort,
  dir,
  basePath,
  preservedParams = {},
}: {
  companies: CompanyRow[];
  onToggle: (id: string, isActive: boolean) => Promise<{ error?: string; success?: boolean }>;
  sort: string;
  dir: SortDirection;
  basePath: string;
  preservedParams?: Record<string, string | undefined>;
}) {
  if (companies.length === 0) {
    return <p className="text-sm text-slate-500">Todavía no hay empresas registradas.</p>;
  }

  const headProps = {
    currentSort: sort,
    currentDir: dir,
    basePath,
    preservedParams,
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left">
            <SortableTableHead label="Empresa" column="name" {...headProps} />
            <th className="px-3 py-2 text-slate-500">Admin</th>
            <th className="px-3 py-2 text-slate-500">Módulos</th>
            <SortableTableHead label="Uso" column="products" {...headProps} />
            <SortableTableHead label="Estado" column="isActive" {...headProps} />
            <th className="px-3 py-2 text-slate-500">Acciones</th>
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
