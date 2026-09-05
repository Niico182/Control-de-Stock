import Link from "next/link";
import { redirect } from "next/navigation";
import {
  deleteProductAction,
  getProductForEditAction,
} from "@/lib/actions/company-actions";
import { getProductCategories } from "@/lib/actions/category-actions";
import { ProductCatalogActions, ProductCatalogEmptyState } from "@/components/products/product-catalog-actions";
import { ProductSearch } from "@/components/products/product-search";
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
import { parseProductSearchQuery, variantSearchFilter } from "@/lib/products/search";
import { getVariantUnitPrice } from "@/lib/products/variants";
import {
  pickPreservedParams,
  PRODUCT_SORT_COLUMNS,
  parseSortParams,
  variantOrderBy,
} from "@/lib/sorting";
import { getCompanyContext } from "@/lib/tenant";

type ProductCatalogPageProps = {
  catalog: ProductCatalogType;
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    sort?: string;
    dir?: string;
    q?: string;
  }>;
};

export async function ProductCatalogPage({ catalog, searchParams }: ProductCatalogPageProps) {
  const { companyId, company, permissions } = await getCompanyContext();
  const config = PRODUCT_CATALOGS[catalog];
  const params = await searchParams;
  const { page, pageSize, skip, take } = parsePaginationParams(params);
  const { sort, dir } = parseSortParams(params, PRODUCT_SORT_COLUMNS, "name");

  const searchQuery = parseProductSearchQuery(params.q);

  if (catalog === "SALE" && !company.enableSales) {
    redirect(getDefaultProductsPath(company.enableSales, company.enableRentals));
  }

  if (catalog === "RENTAL" && !company.enableRentals) {
    redirect(getDefaultProductsPath(company.enableSales, company.enableRentals));
  }

  const where = {
    companyId: companyId!,
    product: {
      type: catalog,
    },
    ...variantSearchFilter(searchQuery),
  };
  const preservedParams = pickPreservedParams(params, ["sort", "dir", "q"]);

  const [variants, total, categories] = await Promise.all([
    prisma.productVariant.findMany({
      where,
      include: {
        product: {
          include: { category: true },
        },
      },
      orderBy: variantOrderBy(sort, dir),
      skip,
      take,
    }),
    prisma.productVariant.count({ where }),
    getProductCategories(catalog),
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
            Inventario exclusivo para {config.singular}. Cada fila representa una variación (color,
            etc.).
          </p>
        </div>
        {permissions.canManageProducts ? (
          <ProductCatalogActions catalog={catalog} canManage={permissions.canManageProducts} />
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
          description={
            searchQuery
              ? `${total} variación${total === 1 ? "" : "es"} para "${searchQuery}"`
              : `${total} variación${total === 1 ? "" : "es"} de ${config.singular}`
          }
        />
        <div className="mb-4">
          <ProductSearch defaultQuery={searchQuery ?? ""} />
        </div>

        {total === 0 && !searchQuery ? (
          <ProductCatalogEmptyState
            catalog={catalog}
            canManage={permissions.canManageProducts}
          />
        ) : (
          <>
            <ProductTable
              variants={variants.map((variant) => ({
                id: variant.id,
                productId: variant.productId,
                sku: variant.sku,
                productName: variant.product.name,
                variantLabel: variant.label,
                categoryId: variant.product.categoryId,
                categoryName: variant.product.category?.name ?? null,
                description: variant.product.description,
                basePrice: Number(variant.product.basePrice),
                price: getVariantUnitPrice(
                  { price: variant.price != null ? Number(variant.price) : null },
                  { basePrice: Number(variant.product.basePrice) },
                ),
                quantityTotal: variant.quantityTotal,
                quantityReserved: variant.quantityReserved,
                quantityRented: variant.quantityRented,
                type: variant.product.type as ProductCatalogType,
                isActive: variant.isActive && variant.product.isActive,
              }))}
              categories={categories}
              canManage={permissions.canManageProducts}
              onDelete={deleteProductAction}
              onLoadProduct={getProductForEditAction}
              showType={false}
              emptyMessage={
                searchQuery
                  ? `No se encontraron variaciones con "${searchQuery}".`
                  : "No hay productos cargados."
              }
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
          </>
        )}
      </Card>
    </div>
  );
}
