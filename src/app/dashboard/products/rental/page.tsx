import { ProductCatalogPage } from "@/components/products/product-catalog-page";

export default function RentalProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  return <ProductCatalogPage catalog="RENTAL" searchParams={searchParams} />;
}
