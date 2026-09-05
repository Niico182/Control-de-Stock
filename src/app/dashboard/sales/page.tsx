import Link from "next/link";
import {
  cancelSaleAction,
  completeSaleAction,
} from "@/lib/actions/sale-actions";
import { SaleForm } from "@/components/sales/sale-form";
import { SaleActions } from "@/components/sales/sale-actions";
import { saleStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { prisma } from "@/lib/db";
import { getOrderProductOptions } from "@/lib/products/order-options";
import { paginationMeta, parsePaginationParams } from "@/lib/pagination";
import {
  pickPreservedParams,
  parseSortParams,
  SALE_SORT_COLUMNS,
  saleOrderBy,
} from "@/lib/sorting";
import { getCompanyContext } from "@/lib/tenant";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string; sort?: string; dir?: string }>;
}) {
  const { companyId, company, permissions } = await getCompanyContext();
  const params = await searchParams;
  const { page, pageSize, skip, take } = parsePaginationParams(params);
  const { sort, dir } = parseSortParams(params, SALE_SORT_COLUMNS, "createdAt");
  const preservedParams = pickPreservedParams(params, ["sort", "dir"]);

  if (!company.enableSales) {
    return <p className="text-slate-600">El módulo de ventas no está activo.</p>;
  }

  const salesWhere = { companyId: companyId! };
  const headProps = {
    currentSort: sort,
    currentDir: dir,
    basePath: "/dashboard/sales",
    preservedParams,
  };

  const [sales, total, products] = await Promise.all([
    prisma.saleOrder.findMany({
      where: salesWhere,
      include: { items: { include: { productVariant: { include: { product: true } } } } },
      orderBy: saleOrderBy(sort, dir),
      skip,
      take,
    }),
    prisma.saleOrder.count({ where: salesWhere }),
    getOrderProductOptions(companyId!, "SALE"),
  ]);

  const meta = paginationMeta(total, page, pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ventas</h2>
          <p className="text-slate-600">Preventas, ventas completadas y cancelaciones.</p>
        </div>
        {permissions.canCreateOrders ? (
          <Link href="/dashboard/sales/new">
            <Button>Nueva venta</Button>
          </Link>
        ) : null}
      </div>

      <Card>
        <CardHeader
          title="Historial de ventas"
          description={`${total} venta${total === 1 ? "" : "s"} registrada${total === 1 ? "" : "s"}`}
        />
        {sales.length === 0 ? (
          <p className="text-sm text-slate-500">No hay ventas registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <SortableTableHead label="Cliente" column="clientName" {...headProps} />
                  <SortableTableHead label="Estado" column="status" {...headProps} />
                  <SortableTableHead label="Total" column="totalPrice" {...headProps} />
                  <SortableTableHead label="Fecha" column="createdAt" {...headProps} />
                  <th className="px-3 py-2 text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b border-slate-100">
                    <td className="px-3 py-3">{sale.clientName}</td>
                    <td className="px-3 py-3">{saleStatusBadge(sale.status)}</td>
                    <td className="px-3 py-3">
                      {formatCurrency(Number(sale.totalPrice), company.currency)}
                    </td>
                    <td className="px-3 py-3">{formatDate(sale.createdAt)}</td>
                    <td className="px-3 py-3">
                      {permissions.canCreateOrders && sale.status === "PRESALE" ? (
                        <SaleActions
                          saleId={sale.id}
                          onComplete={completeSaleAction}
                          onCancel={cancelSaleAction}
                        />
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PaginationControls
          meta={meta}
          basePath="/dashboard/sales"
          preservedParams={preservedParams}
        />
      </Card>

      {total === 0 && permissions.canCreateOrders ? (
        <Card>
          <CardHeader title="Crear primera venta" />
          <SaleForm products={products} />
        </Card>
      ) : null}
    </div>
  );
}
