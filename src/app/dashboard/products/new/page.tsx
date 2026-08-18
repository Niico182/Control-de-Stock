import { redirect } from "next/navigation";
import { PRODUCT_CATALOGS } from "@/lib/products/catalog";
import { getCompanyContext } from "@/lib/tenant";

export default async function LegacyNewProductPage() {
  const { company } = await getCompanyContext();

  if (company.enableSales && !company.enableRentals) {
    redirect(PRODUCT_CATALOGS.SALE.newHref);
  }

  if (company.enableRentals && !company.enableSales) {
    redirect(PRODUCT_CATALOGS.RENTAL.newHref);
  }

  redirect("/dashboard/products");
}
