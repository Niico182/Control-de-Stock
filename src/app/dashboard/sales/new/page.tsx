import { redirect } from "next/navigation";
import { SaleForm } from "@/components/sales/sale-form";
import { Card, CardHeader } from "@/components/ui/card";
import { getOrderProductOptions } from "@/lib/products/order-options";
import { getCompanyContext } from "@/lib/tenant";

export default async function NewSalePage() {
  const { companyId, company, permissions } = await getCompanyContext();

  if (!permissions.canCreateOrders) {
    redirect("/dashboard/sales");
  }

  if (!company.enableSales) {
    redirect("/dashboard/sales");
  }

  const products = await getOrderProductOptions(companyId!, "SALE");

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Nueva venta</h2>
        <p className="text-slate-600">Se creará en estado preventa y reservará stock.</p>
      </div>
      <Card>
        <CardHeader title="Datos de la venta" />
        <SaleForm products={products} />
      </Card>
    </div>
  );
}
