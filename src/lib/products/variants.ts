import { normalizeCategoryName } from "@/lib/products/categories";

export type VariantAttributes = Record<string, string>;

export type ProductVariantDraft = {
  id?: string;
  color?: string;
  quantity: number;
  price?: number | null;
  cost?: number | null;
  sku?: string;
  isActive?: boolean;
};

export type ResolvedVariantDraft = {
  id?: string;
  label: string;
  attributes: VariantAttributes;
  normalizedAttributes: string;
  quantity: number;
  price?: number | null;
  cost?: number | null;
  sku?: string;
  isActive: boolean;
};

export const DEFAULT_VARIANT_LABEL = "Único";

export function buildVariantAttributes(color?: string): VariantAttributes {
  const trimmed = color?.trim();
  if (!trimmed) {
    return {};
  }

  return { color: trimmed };
}

export function buildNormalizedAttributes(attributes: VariantAttributes): string {
  const entries = Object.entries(attributes)
    .filter(([, value]) => value.trim().length > 0)
    .sort(([left], [right]) => left.localeCompare(right));

  if (entries.length === 0) {
    return "";
  }

  return entries
    .map(([key, value]) => `${key}:${normalizeCategoryName(value)}`)
    .join("|");
}

export function buildVariantLabel(attributes: VariantAttributes): string {
  const color = attributes.color?.trim();
  if (color) {
    return color;
  }

  return DEFAULT_VARIANT_LABEL;
}

export function resolveVariantDrafts(
  drafts: ProductVariantDraft[],
  options?: { requireColor?: boolean },
): { variants?: ResolvedVariantDraft[]; error?: string } {
  if (drafts.length === 0) {
    return { error: "Agregá al menos una variación." };
  }

  const requireColor = options?.requireColor ?? drafts.length > 1;
  const normalizedKeys = new Set<string>();
  const variants: ResolvedVariantDraft[] = [];

  for (const draft of drafts) {
    const color = draft.color?.trim();

    if (requireColor && !color) {
      return { error: "Cada variación necesita un color." };
    }

    const attributes = buildVariantAttributes(color);
    const normalizedAttributes = buildNormalizedAttributes(attributes);

    if (normalizedKeys.has(normalizedAttributes)) {
      return { error: "Hay variaciones duplicadas." };
    }

    normalizedKeys.add(normalizedAttributes);

    if (draft.quantity < 0) {
      return { error: "El stock no puede ser negativo." };
    }

    variants.push({
      id: draft.id,
      label: buildVariantLabel(attributes),
      attributes,
      normalizedAttributes,
      quantity: draft.quantity,
      price: draft.price ?? null,
      cost: draft.cost ?? null,
      sku: draft.sku?.trim().toUpperCase() || undefined,
      isActive: draft.isActive ?? true,
    });
  }

  return { variants };
}

export function getVariantUnitPrice(
  variant: { price: number | null | undefined },
  product: { basePrice: number },
): number {
  return variant.price ?? product.basePrice;
}

export function formatVariantDisplayName(productName: string, variantLabel: string) {
  if (variantLabel === DEFAULT_VARIANT_LABEL) {
    return productName;
  }

  return `${productName} — ${variantLabel}`;
}

export function parseVariantAttributes(value: unknown): VariantAttributes {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const attributes: VariantAttributes = {};

  for (const [key, rawValue] of Object.entries(value)) {
    if (typeof rawValue === "string" && rawValue.trim().length > 0) {
      attributes[key] = rawValue.trim();
    }
  }

  return attributes;
}
