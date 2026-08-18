export type ProductCatalogType = "SALE" | "RENTAL";

export const PRODUCT_CATALOGS: Record<
  ProductCatalogType,
  {
    label: string;
    singular: string;
    listHref: string;
    newHref: string;
    orderFilter: ProductCatalogType;
  }
> = {
  SALE: {
    label: "Productos de venta",
    singular: "venta",
    listHref: "/dashboard/products/sale",
    newHref: "/dashboard/products/sale/new",
    orderFilter: "SALE",
  },
  RENTAL: {
    label: "Productos de alquiler",
    singular: "alquiler",
    listHref: "/dashboard/products/rental",
    newHref: "/dashboard/products/rental/new",
    orderFilter: "RENTAL",
  },
};

export function getDefaultProductsPath(enableSales: boolean, enableRentals: boolean) {
  if (enableSales && !enableRentals) return PRODUCT_CATALOGS.SALE.listHref;
  if (enableRentals && !enableSales) return PRODUCT_CATALOGS.RENTAL.listHref;
  return "/dashboard/products";
}

export const PRODUCT_REVALIDATE_PATHS = [
  "/dashboard/products",
  "/dashboard/products/sale",
  "/dashboard/products/rental",
  "/dashboard/products/sale/new",
  "/dashboard/products/rental/new",
] as const;

export function productTypeLabel(type: string) {
  switch (type) {
    case "SALE":
      return "Venta";
    case "RENTAL":
      return "Alquiler";
    case "BOTH":
      return "Venta y alquiler";
    default:
      return type;
  }
}
