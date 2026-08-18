export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export type PaginationParams = {
  page?: string | undefined;
  pageSize?: string | undefined;
};

export type PaginationMeta = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
};

export function parsePaginationParams(
  searchParams: PaginationParams,
  defaults: { pageSize?: number } = {},
) {
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(searchParams.pageSize) || defaults.pageSize || DEFAULT_PAGE_SIZE),
  );
  const page = Math.max(1, Number(searchParams.page) || 1);

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function paginationMeta(
  total: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  return {
    total,
    page: safePage,
    pageSize,
    totalPages,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
  };
}

export function paginationRange(meta: PaginationMeta) {
  if (meta.total === 0) {
    return { from: 0, to: 0 };
  }

  return {
    from: (meta.page - 1) * meta.pageSize + 1,
    to: Math.min(meta.page * meta.pageSize, meta.total),
  };
}

export function buildPageHref(
  basePath: string,
  page: number,
  preservedParams: Record<string, string | undefined> = {},
  pageParam = "page",
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(preservedParams)) {
    if (value) {
      params.set(key, value);
    }
  }

  if (page > 1) {
    params.set(pageParam, String(page));
  } else {
    params.delete(pageParam);
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
