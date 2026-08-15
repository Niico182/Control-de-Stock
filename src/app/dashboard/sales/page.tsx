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
import { prisma } from "@/lib/db";
import { getCompanyContext } from "@/lib/tenant";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function SalesPage() {
  const { companyId, company, permissions } = await getCompanyContext();

  if (!company.enableSales) {
    return <p className="text-slate-600">El módulo de ventas no está activo.</p>;
  }

  const [sales, products] = await Promise.all([
    prisma.saleOrder.findMany({
      where: { companyId: companyId! },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: {
        companyId: companyId!,
        type: { in: ["SALE", "BOTH"] },
      },
      orderBy: { name: "asc" },
    }),
  ]);

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
        <CardHeader title="Historial de ventas" />
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Acciones</th>
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
      </Card>

      {sales.length === 0 && permissions.canCreateOrders ? (
        <Card>
          <CardHeader title="Crear primera venta" />
          <SaleForm
            products={products.map((p) => ({
              id: p.id,
              name: p.name,
              price: Number(p.price),
              available:
                p.quantityTotal - p.quantityReserved - p.quantityRented,
            }))}
          />
        </Card>
      ) : null}
    </div>
  );
}
