import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelRentalAction } from "@/lib/actions/rental-actions";
import { RentalActions } from "@/components/rentals/rental-actions";
import { rentalStatusBadge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import {
  RentalItemsTable,
  RentalReturnItemsTable,
} from "@/components/rentals/rental-detail-tables";
import { prisma } from "@/lib/db";
import { getCompanyContext } from "@/lib/tenant";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function RentalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { companyId, company, permissions } = await getCompanyContext();

  if (!company.enableRentals) {
    notFound();
  }

  const rental = await prisma.rentalOrder.findFirst({
    where: { id, companyId: companyId! },
    include: {
      items: { include: { product: true } },
      return: { include: { items: true } },
    },
  });

  if (!rental) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard/rentals" className="text-sm text-blue-600 underline">
            ← Volver al listado
          </Link>
          <h2 className="mt-2 text-2xl font-bold">Detalle del alquiler</h2>
          <p className="text-slate-600">Pedido de {rental.clientName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {rentalStatusBadge(rental.status)}
          <a
            href={`/api/rentals/${rental.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-medium hover:bg-slate-50"
          >
            Exportar PDF
          </a>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Información del pedido" />
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Cliente</dt>
              <dd className="font-medium">{rental.clientName}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Dirección</dt>
              <dd className="font-medium">{rental.address}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Fecha de alquiler</dt>
              <dd className="font-medium">{formatDate(rental.rentalDate)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Creado</dt>
              <dd className="font-medium">{formatDate(rental.createdAt)}</dd>
            </div>
            {rental.returnedAt ? (
              <div>
                <dt className="text-slate-500">Devuelto</dt>
                <dd className="font-medium">{formatDate(rental.returnedAt)}</dd>
              </div>
            ) : null}
            {rental.cancelledAt ? (
              <div>
                <dt className="text-slate-500">Cancelado</dt>
                <dd className="font-medium">{formatDate(rental.cancelledAt)}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-slate-500">Total</dt>
              <dd className="text-lg font-semibold">
                {formatCurrency(Number(rental.totalPrice), company.currency)}
              </dd>
            </div>
            {rental.notes ? (
              <div>
                <dt className="text-slate-500">Notas</dt>
                <dd>{rental.notes}</dd>
              </div>
            ) : null}
          </dl>
        </Card>

        <Card>
          <CardHeader title="Productos alquilados" />
          <RentalItemsTable
            currency={company.currency}
            items={rental.items.map((item) => ({
              id: item.id,
              productName: item.product.name,
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
              subtotal: Number(item.unitPrice) * item.quantity,
            }))}
          />
        </Card>
      </div>

      {rental.return ? (
        <Card>
          <CardHeader title="Devolución registrada" description={rental.return.notes ?? undefined} />
          <RentalReturnItemsTable
            items={rental.return.items.map((item) => ({
              id: item.id,
              productName:
                rental.items.find((row) => row.productId === item.productId)?.product.name ??
                item.productId,
              quantityReturned: item.quantityReturned,
              quantityMissing: item.quantityMissing,
            }))}
          />
        </Card>
      ) : null}

      {permissions.canCreateOrders && rental.status === "ACTIVE" ? (
        <Card>
          <CardHeader title="Acciones" />
          <RentalActions
            rentalId={rental.id}
            status={rental.status}
            items={rental.items.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              quantity: item.quantity,
            }))}
            canManage
            onCancel={cancelRentalAction}
          />
        </Card>
      ) : null}
    </div>
  );
}
