import { ProductCatalogPage } from "@/components/products/product-catalog-page";

export default function SaleProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  return <ProductCatalogPage catalog="SALE" searchParams={searchParams} />;
}
