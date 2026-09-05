import Link from "next/link";
import { redirect } from "next/navigation";
import { getProductCategories } from "@/lib/actions/category-actions";
import { ProductBulkImport } from "@/components/products/product-bulk-import";
import { ProductCategoryManager } from "@/components/products/product-category-manager";
import { ProductForm } from "@/components/products/product-form";
import { Card, CardHeader } from "@/components/ui/card";
import {
  getDefaultProductsPath,
  PRODUCT_CATALOGS,
  type ProductCatalogType,
} from "@/lib/products/catalog";
import { getCompanyContext } from "@/lib/tenant";

type ProductCreatePageProps = {
  catalog: ProductCatalogType;
};

export async function ProductCreatePage({ catalog }: ProductCreatePageProps) {
  const { company, permissions } = await getCompanyContext();
  const config = PRODUCT_CATALOGS[catalog];

  if (!permissions.canManageProducts) {
    redirect(config.listHref);
  }

  if (catalog === "SALE" && !company.enableSales) {
    redirect(getDefaultProductsPath(company.enableSales, company.enableRentals));
  }

  if (catalog === "RENTAL" && !company.enableRentals) {
    redirect(getDefaultProductsPath(company.enableSales, company.enableRentals));
  }

  const categories = await getProductCategories(catalog);

  return (
    <div className="w-full space-y-6">
      <div>
        <Link href={config.listHref} className="text-sm text-blue-600 underline">
          ← Volver al inventario
        </Link>
        <h2 className="mt-2 text-2xl font-bold">Cargar productos de {config.singular}</h2>
        <p className="text-slate-600">
          Los productos creados acá solo estarán disponibles para {config.singular}.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Categorías"
          description="Las categorías se muestran siempre acá. Creá las que necesites antes de cargar productos."
        />
        <ProductCategoryManager catalogType={catalog} categories={categories} />
      </Card>

      <Card>
        <CardHeader title="Nuevo producto" description={`Alta manual para ${config.singular}.`} />
        <ProductForm
          productType={catalog}
          redirectHref={config.listHref}
          categories={categories}
        />
      </Card>

      <div id="import">
        <ProductBulkImport productType={catalog} categories={categories} />
      </div>
    </div>
  );
}
