import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteProductAction } from "@/lib/actions/company-actions";
import { ProductTable } from "@/components/products/product-table";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  getDefaultProductsPath,
  PRODUCT_CATALOGS,
  type ProductCatalogType,
} from "@/lib/products/catalog";
import { prisma } from "@/lib/db";
import { paginationMeta, parsePaginationParams } from "@/lib/pagination";
import {
  pickPreservedParams,
  PRODUCT_SORT_COLUMNS,
  parseSortParams,
  productOrderBy,
} from "@/lib/sorting";
import { getCompanyContext } from "@/lib/tenant";

type ProductCatalogPageProps = {
  catalog: ProductCatalogType;
  searchParams: Promise<{ page?: string; pageSize?: string; sort?: string; dir?: string }>;
};

export async function ProductCatalogPage({ catalog, searchParams }: ProductCatalogPageProps) {
  const { companyId, company, permissions } = await getCompanyContext();
  const config = PRODUCT_CATALOGS[catalog];
  const params = await searchParams;
  const { page, pageSize, skip, take } = parsePaginationParams(params);
  const { sort, dir } = parseSortParams(params, PRODUCT_SORT_COLUMNS, "code");

  if (catalog === "SALE" && !company.enableSales) {
    redirect(getDefaultProductsPath(company.enableSales, company.enableRentals));
  }

  if (catalog === "RENTAL" && !company.enableRentals) {
    redirect(getDefaultProductsPath(company.enableSales, company.enableRentals));
  }

  const where = { companyId: companyId!, type: catalog };
  const preservedParams = pickPreservedParams(params, ["sort", "dir"]);

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: productOrderBy(sort, dir),
      skip,
      take,
    }),
    prisma.product.count({ where }),
  ]);

  const meta = paginationMeta(total, page, pageSize);
  const showBothCatalogs = company.enableSales && company.enableRentals;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {showBothCatalogs ? (
            <Link href="/dashboard/products" className="text-sm text-blue-600 underline">
              ← Todos los catálogos
            </Link>
          ) : null}
          <h2 className={`text-2xl font-bold ${showBothCatalogs ? "mt-2" : ""}`}>
            {config.label}
          </h2>
          <p className="text-slate-600">
            Inventario exclusivo para {config.singular}. No se mezcla con el otro catálogo.
          </p>
        </div>
        {permissions.canManageProducts ? (
          <Link href={config.newHref}>
            <Button>Cargar productos</Button>
          </Link>
        ) : null}
      </div>

      {showBothCatalogs ? (
        <div className="flex flex-wrap gap-2">
          <Link href={PRODUCT_CATALOGS.SALE.listHref}>
            <Button variant={catalog === "SALE" ? "default" : "outline"} size="sm">
              Venta
            </Button>
          </Link>
          <Link href={PRODUCT_CATALOGS.RENTAL.listHref}>
            <Button variant={catalog === "RENTAL" ? "default" : "outline"} size="sm">
              Alquiler
            </Button>
          </Link>
        </div>
      ) : null}

      <Card>
        <CardHeader
          title="Inventario"
          description={`${total} producto${total === 1 ? "" : "s"} de ${config.singular} registrado${total === 1 ? "" : "s"}`}
        />
        <ProductTable
          products={products.map((product) => ({
            ...product,
            price: Number(product.price),
          }))}
          canManage={permissions.canManageProducts}
          onDelete={deleteProductAction}
          showType={false}
          sort={sort}
          dir={dir}
          basePath={config.listHref}
          preservedParams={preservedParams}
        />
        <PaginationControls
          meta={meta}
          basePath={config.listHref}
          preservedParams={preservedParams}
        />
      </Card>
    </div>
  );
}
