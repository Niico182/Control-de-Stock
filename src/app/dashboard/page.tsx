import Link from "next/link";
import { getDashboardStats, getMonthlyEarnings } from "@/lib/reports";
import { getCompanyContext } from "@/lib/tenant";
import { formatCurrency } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getDefaultProductsPath,
  PRODUCT_CATALOGS,
} from "@/lib/products/catalog";

export default async function DashboardPage() {
  const { company, companyId } = await getCompanyContext();
  const [stats, earnings] = await Promise.all([
    getDashboardStats(companyId!),
    getMonthlyEarnings(companyId!, 3),
  ]);

  const currentMonth = earnings[earnings.length - 1];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Panel principal</h2>
        <p className="text-slate-600">Resumen de {company.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Productos" value={String(stats.products)} />
        <StatCard title="Stock bajo" value={String(stats.lowStockCount)} />
        <StatCard title="Preventas" value={String(stats.presales)} />
        <StatCard title="Alquileres activos" value={String(stats.activeRentals)} />
      </div>

      <Card>
        <CardHeader
          title="Ganancias del mes"
          description={`Ventas + alquileres: ${formatCurrency(currentMonth?.total ?? 0, company.currency)}`}
        />
        <div className="grid gap-3 md:grid-cols-3">
          {earnings.map((item) => (
            <div key={item.month} className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">{item.month}</p>
              <p className="text-lg font-semibold">{formatCurrency(item.total, company.currency)}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        {company.enableSales ? (
          <Link href="/dashboard/sales/new">
            <Button>Nueva venta</Button>
          </Link>
        ) : null}
        {company.enableRentals ? (
          <Link href="/dashboard/rentals/new">
            <Button variant="secondary">Nuevo alquiler</Button>
          </Link>
        ) : null}
        <Link href={getDefaultProductsPath(company.enableSales, company.enableRentals)}>
          <Button variant="outline">Ver productos</Button>
        </Link>
        {company.enableSales && company.enableRentals ? (
          <>
            <Link href={PRODUCT_CATALOGS.SALE.listHref}>
              <Button variant="outline">Inventario venta</Button>
            </Link>
            <Link href={PRODUCT_CATALOGS.RENTAL.listHref}>
              <Button variant="outline">Inventario alquiler</Button>
            </Link>
          </>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </Card>
  );
}
