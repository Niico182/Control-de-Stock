import { redirect } from "next/navigation";
import { RentalForm } from "@/components/rentals/rental-form";
import { Card, CardHeader } from "@/components/ui/card";
import { getOrderProductOptions } from "@/lib/products/order-options";
import { getCompanyContext } from "@/lib/tenant";

export default async function NewRentalPage() {
  const { companyId, company, permissions } = await getCompanyContext();

  if (!permissions.canCreateOrders || !company.enableRentals) {
    redirect("/dashboard/rentals");
  }

  const products = await getOrderProductOptions(companyId!, "RENTAL");

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Nuevo alquiler</h2>
        <p className="text-slate-600">El stock se descontará al crear el pedido.</p>
      </div>
      <Card>
        <CardHeader title="Datos del pedido" />
        <RentalForm products={products} />
      </Card>
    </div>
  );
}
