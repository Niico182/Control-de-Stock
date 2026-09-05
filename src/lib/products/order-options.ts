import { prisma } from "@/lib/db";
import type { ProductCatalogType } from "@/lib/products/catalog";
import {
  formatVariantDisplayName,
  getVariantUnitPrice,
} from "@/lib/products/variants";
import { getAvailableQuantity } from "@/lib/utils";

export async function getOrderProductOptions(
  companyId: string,
  catalogType: ProductCatalogType,
) {
  const variants = await prisma.productVariant.findMany({
    where: {
      companyId,
      isActive: true,
      product: {
        type: catalogType,
        isActive: true,
      },
    },
    include: {
      product: true,
    },
    orderBy: [{ product: { name: "asc" } }, { label: "asc" }],
  });

  return variants.map((variant) => ({
    id: variant.id,
    name: formatVariantDisplayName(variant.product.name, variant.label),
    price: getVariantUnitPrice(
      { price: variant.price != null ? Number(variant.price) : null },
      { basePrice: Number(variant.product.basePrice) },
    ),
    available: getAvailableQuantity(variant),
  }));
}
