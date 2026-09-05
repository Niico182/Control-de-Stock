import type { ProductCatalogType } from "@/lib/products/catalog";

export function getProductPriceLabel(catalog: ProductCatalogType) {
  return catalog === "SALE" ? "Precio de venta" : "Precio de alquiler";
}

export function parseProductActiveStatus(value?: string) {
  if (!value?.trim()) {
    return true;
  }

  const normalized = value.trim().toLowerCase();

  if (["activo", "active", "si", "sí", "1", "true"].includes(normalized)) {
    return true;
  }

  if (["inactivo", "inactive", "no", "0", "false"].includes(normalized)) {
    return false;
  }

  return null;
}

export function formatProductActiveStatus(isActive: boolean) {
  return isActive ? "Activo" : "Inactivo";
}
