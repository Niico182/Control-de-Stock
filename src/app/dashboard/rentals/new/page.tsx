import { redirect } from "next/navigation";
import { RentalForm } from "@/components/rentals/rental-form";
import { Card, CardHeader } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { getCompanyContext } from "@/lib/tenant";

export default async function NewRentalPage() {
  const { companyId, company, permissions } = await getCompanyContext();

  if (!permissions.canCreateOrders || !company.enableRentals) {
    redirect("/dashboard/rentals");
  }

  const products = await prisma.product.findMany({
    where: {
      companyId: companyId!,
      type: { in: ["RENTAL", "BOTH"] },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Nuevo alquiler</h2>
        <p className="text-slate-600">El stock se descontará al crear el pedido.</p>
      </div>
      <Card>
        <CardHeader title="Datos del pedido" />
        <RentalForm
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            available: p.quantityTotal - p.quantityReserved - p.quantityRented,
          }))}
        />
      </Card>
    </div>
  );
}
