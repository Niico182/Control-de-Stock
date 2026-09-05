import Link from "next/link";
import { Suspense } from "react";
import { cancelRentalAction } from "@/lib/actions/rental-actions";
import { RentalActions } from "@/components/rentals/rental-actions";
import { RentalStatusFilter, RentalViewLink } from "@/components/rentals/rental-list-tools";
import { rentalStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { prisma } from "@/lib/db";
import type { RentalStatus } from "@/generated/prisma/client";
import { paginationMeta, parsePaginationParams } from "@/lib/pagination";
import {
  pickPreservedParams,
  parseSortParams,
  RENTAL_SORT_COLUMNS,
  rentalOrderBy,
} from "@/lib/sorting";
import { getCompanyContext } from "@/lib/tenant";
import { formatVariantDisplayName } from "@/lib/products/variants";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function RentalsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    page?: string;
    pageSize?: string;
    sort?: string;
    dir?: string;
  }>;
}) {
  const { companyId, company, permissions } = await getCompanyContext();
  const params = await searchParams;
  const { page, pageSize, skip, take } = parsePaginationParams(params);
  const { sort, dir } = parseSortParams(params, RENTAL_SORT_COLUMNS, "createdAt");
  const { status } = params;

  if (!company.enableRentals) {
    return <p className="text-slate-600">El módulo de alquileres no está activo.</p>;
  }

  const validStatuses: RentalStatus[] = ["ACTIVE", "RETURNED", "CANCELLED"];
  const statusFilter =
    status && validStatuses.includes(status as RentalStatus)
      ? (status as RentalStatus)
      : undefined;

  const rentalsWhere = {
    companyId: companyId!,
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const preservedParams = pickPreservedParams(params, ["sort", "dir", "status"]);
  const headProps = {
    currentSort: sort,
    currentDir: dir,
    basePath: "/dashboard/rentals",
    preservedParams,
  };

  const [rentals, total] = await Promise.all([
    prisma.rentalOrder.findMany({
      where: rentalsWhere,
      include: {
        items: { include: { productVariant: { include: { product: true } } } },
        return: { include: { items: true } },
      },
      orderBy: rentalOrderBy(sort, dir),
      skip,
      take,
    }),
    prisma.rentalOrder.count({ where: rentalsWhere }),
  ]);

  const meta = paginationMeta(total, page, pageSize);
  const currentFilter = statusFilter ?? "ALL";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Alquileres</h2>
          <p className="text-slate-600">
            Consultá todos los pedidos sin importar su estado.
          </p>
        </div>
        {permissions.canCreateOrders ? (
          <Link href="/dashboard/rentals/new">
            <Button>Nuevo alquiler</Button>
          </Link>
        ) : null}
      </div>

      <Suspense fallback={null}>
        <RentalStatusFilter current={currentFilter} />
      </Suspense>

      <Card>
        <CardHeader
          title="Historial de pedidos"
          description={`${total} alquiler${total === 1 ? "" : "es"} encontrado${total === 1 ? "" : "s"}`}
        />
        {rentals.length === 0 ? (
          <p className="text-sm text-slate-500">
            No hay alquileres{statusFilter ? " con este estado" : ""}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <SortableTableHead label="Cliente" column="clientName" {...headProps} />
                  <SortableTableHead label="Dirección" column="address" {...headProps} />
                  <SortableTableHead label="Fecha" column="rentalDate" {...headProps} />
                  <SortableTableHead label="Estado" column="status" {...headProps} />
                  <SortableTableHead label="Total" column="totalPrice" {...headProps} />
                  <th className="px-3 py-2 text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rentals.map((rental) => (
                  <tr key={rental.id} className="border-b border-slate-100">
                    <td className="px-3 py-3">{rental.clientName}</td>
                    <td className="px-3 py-3">{rental.address}</td>
                    <td className="px-3 py-3">{formatDate(rental.rentalDate)}</td>
                    <td className="px-3 py-3">{rentalStatusBadge(rental.status)}</td>
                    <td className="px-3 py-3">
                      {formatCurrency(Number(rental.totalPrice), company.currency)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <RentalViewLink rentalId={rental.id} />
                        <RentalActions
                          rentalId={rental.id}
                          status={rental.status}
                          items={rental.items.map((item) => ({
                            productVariantId: item.productVariantId,
                            productName: formatVariantDisplayName(
                              item.productVariant.product.name,
                              item.productVariant.label,
                            ),
                            quantity: item.quantity,
                          }))}
                          canManage={permissions.canCreateOrders}
                          onCancel={cancelRentalAction}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PaginationControls
          meta={meta}
          basePath="/dashboard/rentals"
          preservedParams={preservedParams}
        />
      </Card>
    </div>
  );
}
