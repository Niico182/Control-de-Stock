import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/card";
import {
  getDefaultProductsPath,
  PRODUCT_CATALOGS,
} from "@/lib/products/catalog";
import { getCompanyContext } from "@/lib/tenant";

export default async function ProductsHubPage() {
  const { company } = await getCompanyContext();

  if (!company.enableSales && !company.enableRentals) {
    return (
      <p className="text-slate-600">No hay módulos de productos activos para esta empresa.</p>
    );
  }

  const defaultPath = getDefaultProductsPath(company.enableSales, company.enableRentals);

  if (defaultPath !== "/dashboard/products") {
    redirect(defaultPath);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Productos</h2>
        <p className="text-slate-600">
          Elegí el catálogo que querés gestionar. Venta y alquiler son inventarios separados.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {company.enableSales ? (
          <Link href={PRODUCT_CATALOGS.SALE.listHref}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader
                title={PRODUCT_CATALOGS.SALE.label}
                description="Productos que se venden. Stock con reservas de preventa."
              />
            </Card>
          </Link>
        ) : null}

        {company.enableRentals ? (
          <Link href={PRODUCT_CATALOGS.RENTAL.listHref}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader
                title={PRODUCT_CATALOGS.RENTAL.label}
                description="Productos que se alquilan. Stock con unidades en alquiler activo."
              />
            </Card>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
