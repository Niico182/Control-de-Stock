export type ProductCategoryOption = {
  id: string;
  name: string;
};

export const CATEGORY_SCROLL_THRESHOLD = 5;

export function categoryListScrollClass(count: number) {
  return count > CATEGORY_SCROLL_THRESHOLD
    ? "max-h-[220px] overflow-y-auto pr-1"
    : "";
}

export function filterCategoriesByQuery(
  categories: ProductCategoryOption[],
  query?: string,
) {
  const term = query?.trim();
  if (!term) {
    return categories;
  }

  const normalizedTerm = normalizeCategoryName(term);

  return categories.filter((category) =>
    normalizeCategoryName(category.name).includes(normalizedTerm),
  );
}

export function normalizeCategoryName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function findCategoryByName(
  name: string,
  categories: ProductCategoryOption[],
) {
  const normalized = normalizeCategoryName(name);
  return categories.find(
    (category) => normalizeCategoryName(category.name) === normalized,
  );
}
