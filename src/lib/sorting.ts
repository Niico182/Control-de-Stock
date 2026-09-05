export type SortDirection = "asc" | "desc";

export type SortParams = {
  sort?: string;
  dir?: string;
};

function inverseDir(dir: SortDirection): SortDirection {
  return dir === "asc" ? "desc" : "asc";
}

export function parseSortParams<T extends string>(
  searchParams: SortParams,
  allowed: readonly T[],
  defaultSort: T,
): { sort: T; dir: SortDirection } {
  const sort = allowed.includes(searchParams.sort as T)
    ? (searchParams.sort as T)
    : defaultSort;
  const dir: SortDirection = searchParams.dir === "desc" ? "desc" : "asc";

  return { sort, dir };
}

export function getNextSortDirection(
  currentSort: string,
  currentDir: SortDirection,
  column: string,
): SortDirection {
  if (currentSort !== column) {
    return "asc";
  }

  return currentDir === "asc" ? "desc" : "asc";
}

export function buildSortHref(
  basePath: string,
  column: string,
  currentSort: string,
  currentDir: SortDirection,
  preservedParams: Record<string, string | undefined> = {},
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(preservedParams)) {
    if (value && key !== "sort" && key !== "dir" && key !== "page") {
      params.set(key, value);
    }
  }

  params.set("sort", column);
  params.set("dir", getNextSortDirection(currentSort, currentDir, column));

  return `${basePath}?${params.toString()}`;
}

export function pickPreservedParams(
  params: Record<string, string | undefined>,
  keys: string[],
) {
  const preserved: Record<string, string | undefined> = {};

  for (const key of keys) {
    if (params[key]) {
      preserved[key] = params[key];
    }
  }

  return preserved;
}

export const PRODUCT_SORT_COLUMNS = [
  "code",
  "name",
  "variant",
  "category",
  "price",
  "quantityTotal",
  "available",
  "quantityReserved",
  "quantityRented",
  "isActive",
  "type",
] as const;

export type ProductSortColumn = (typeof PRODUCT_SORT_COLUMNS)[number];

export function variantOrderBy(sort: string, dir: SortDirection) {
  switch (sort) {
    case "code":
      return { sku: dir };
    case "name":
      return { product: { name: dir } };
    case "variant":
      return { label: dir };
    case "category":
      return { product: { category: { name: dir } } };
    case "price":
      return { price: dir };
    case "quantityTotal":
      return { quantityTotal: dir };
    case "quantityReserved":
      return { quantityReserved: dir };
    case "quantityRented":
      return { quantityRented: dir };
    case "isActive":
      return { isActive: dir };
    case "type":
      return { product: { type: dir } };
    case "available":
      return [
        { quantityTotal: dir },
        { quantityReserved: inverseDir(dir) },
        { quantityRented: inverseDir(dir) },
      ];
    default:
      return { product: { name: "asc" as const } };
  }
}

/** @deprecated Usar variantOrderBy */
export function productOrderBy(sort: string, dir: SortDirection) {
  return variantOrderBy(sort, dir);
}

export const SALE_SORT_COLUMNS = ["clientName", "status", "totalPrice", "createdAt"] as const;

export function saleOrderBy(sort: string, dir: SortDirection) {
  switch (sort) {
    case "clientName":
      return { clientName: dir };
    case "status":
      return { status: dir };
    case "totalPrice":
      return { totalPrice: dir };
    case "createdAt":
      return { createdAt: dir };
    default:
      return { createdAt: "desc" as const };
  }
}

export const RENTAL_SORT_COLUMNS = [
  "clientName",
  "address",
  "rentalDate",
  "status",
  "totalPrice",
  "createdAt",
] as const;

export function rentalOrderBy(sort: string, dir: SortDirection) {
  switch (sort) {
    case "clientName":
      return { clientName: dir };
    case "address":
      return { address: dir };
    case "rentalDate":
      return { rentalDate: dir };
    case "status":
      return { status: dir };
    case "totalPrice":
      return { totalPrice: dir };
    case "createdAt":
      return { createdAt: dir };
    default:
      return { createdAt: "desc" as const };
  }
}

export const COMPANY_SORT_COLUMNS = [
  "name",
  "slug",
  "products",
  "orders",
  "isActive",
] as const;

export function companyOrderBy(sort: string, dir: SortDirection) {
  switch (sort) {
    case "name":
      return { name: dir };
    case "slug":
      return { slug: dir };
    case "products":
      return { products: { _count: dir } };
    case "orders":
      return { saleOrders: { _count: dir } };
    case "isActive":
      return { isActive: dir };
    default:
      return { createdAt: "desc" as const };
  }
}

export const REPORT_SORT_COLUMNS = ["month", "sales", "rentals", "total"] as const;

export type ReportRow = {
  month: string;
  sales: number;
  rentals: number;
  total: number;
};

export function sortReportRows(rows: ReportRow[], sort: string, dir: SortDirection) {
  const factor = dir === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    switch (sort) {
      case "month":
        return a.month.localeCompare(b.month, "es") * factor;
      case "sales":
        return (a.sales - b.sales) * factor;
      case "rentals":
        return (a.rentals - b.rentals) * factor;
      case "total":
        return (a.total - b.total) * factor;
      default:
        return a.month.localeCompare(b.month, "es") * factor;
    }
  });
}

export function sortRows<T>(
  rows: T[],
  sort: string,
  dir: SortDirection,
  getters: Record<string, (row: T) => string | number>,
) {
  const getter = getters[sort];
  if (!getter) {
    return rows;
  }

  const factor = dir === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    const left = getter(a);
    const right = getter(b);

    if (typeof left === "number" && typeof right === "number") {
      return (left - right) * factor;
    }

    return String(left).localeCompare(String(right), "es", { sensitivity: "base" }) * factor;
  });
}
