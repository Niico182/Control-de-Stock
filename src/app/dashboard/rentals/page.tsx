import Link from "next/link";
import { cancelRentalAction } from "@/lib/actions/rental-actions";
import { RentalActions } from "@/components/rentals/rental-actions";
import { rentalStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { getCompanyContext } from "@/lib/tenant";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function RentalsPage() {
  const { companyId, company, permissions } = await getCompanyContext();

  if (!company.enableRentals) {
    return <p className="text-slate-600">El módulo de alquileres no está activo.</p>;
  }

  const rentals = await prisma.rentalOrder.findMany({
    where: { companyId: companyId! },
    include: {
      items: { include: { product: true } },
      return: { include: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Alquileres</h2>
          <p className="text-slate-600">Pedidos, devoluciones, faltantes y exportación PDF.</p>
        </div>
        {permissions.canCreateOrders ? (
          <Link href="/dashboard/rentals/new">
            <Button>Nuevo alquiler</Button>
          </Link>
        ) : null}
      </div>

      <Card>
        <CardHeader title="Historial de pedidos" />
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Dirección</th>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Acciones</th>
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
                    <RentalActions
                      rentalId={rental.id}
                      status={rental.status}
                      items={rental.items.map((item) => ({
                        productId: item.productId,
                        productName: item.product.name,
                        quantity: item.quantity,
                      }))}
                      canManage={permissions.canCreateOrders}
                      onCancel={cancelRentalAction}
                    />
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
