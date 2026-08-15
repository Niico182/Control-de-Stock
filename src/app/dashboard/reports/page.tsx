import { redirect } from "next/navigation";
import { getMonthlyEarnings } from "@/lib/reports";
import { getCompanyContext } from "@/lib/tenant";
import { formatCurrency } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/card";

export default async function ReportsPage() {
  const { company, companyId, permissions } = await getCompanyContext();

  if (!permissions.canViewReports && permissions.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const earnings = await getMonthlyEarnings(companyId!, 12);
  const yearTotal = earnings.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Reportes</h2>
        <p className="text-slate-600">Ganancias mensuales por ventas y alquileres.</p>
      </div>

      <Card>
        <CardHeader
          title="Total últimos 12 meses"
          description={formatCurrency(yearTotal, company.currency)}
        />
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-3 py-2">Mes</th>
                <th className="px-3 py-2">Ventas</th>
                <th className="px-3 py-2">Alquileres</th>
                <th className="px-3 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {earnings.map((item) => (
                <tr key={item.month} className="border-b border-slate-100">
                  <td className="px-3 py-3">{item.month}</td>
                  <td className="px-3 py-3">
                    {formatCurrency(item.sales, company.currency)}
                  </td>
                  <td className="px-3 py-3">
                    {formatCurrency(item.rentals, company.currency)}
                  </td>
                  <td className="px-3 py-3 font-medium">
                    {formatCurrency(item.total, company.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
