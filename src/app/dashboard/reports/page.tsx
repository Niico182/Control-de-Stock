import { redirect } from "next/navigation";
import { getMonthlyEarnings } from "@/lib/reports";
import { getCompanyContext } from "@/lib/tenant";
import { formatCurrency } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/card";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import {
  parseSortParams,
  pickPreservedParams,
  REPORT_SORT_COLUMNS,
  sortReportRows,
} from "@/lib/sorting";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; dir?: string }>;
}) {
  const { company, companyId, permissions } = await getCompanyContext();
  const params = await searchParams;
  const { sort, dir } = parseSortParams(params, REPORT_SORT_COLUMNS, "month");
  const preservedParams = pickPreservedParams(params, ["sort", "dir"]);

  if (!permissions.canViewReports && permissions.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const earnings = sortReportRows(await getMonthlyEarnings(companyId!, 12), sort, dir);
  const yearTotal = earnings.reduce((sum, item) => sum + item.total, 0);
  const headProps = {
    currentSort: sort,
    currentDir: dir,
    basePath: "/dashboard/reports",
    preservedParams,
  };

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
              <tr className="border-b border-slate-200 text-left">
                <SortableTableHead label="Mes" column="month" {...headProps} />
                <SortableTableHead label="Ventas" column="sales" {...headProps} />
                <SortableTableHead label="Alquileres" column="rentals" {...headProps} />
                <SortableTableHead label="Total" column="total" {...headProps} />
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
