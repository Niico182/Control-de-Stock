export function parseProductSearchQuery(query?: string) {
  const trimmed = query?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export function productNameSearchFilter(query?: string) {
  const term = parseProductSearchQuery(query);
  if (!term) return {};

  return {
    name: {
      contains: term,
    },
  };
}

export function variantSearchFilter(query?: string) {
  const term = parseProductSearchQuery(query);
  if (!term) return {};

  return {
    OR: [
      { product: { name: { contains: term } } },
      { label: { contains: term } },
      { sku: { contains: term } },
    ],
  };
}
