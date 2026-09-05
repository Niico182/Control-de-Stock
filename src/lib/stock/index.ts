import type {
  Prisma,
  Product,
  ProductVariant,
  StockMovementType,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { formatVariantDisplayName } from "@/lib/products/variants";
import { getAvailableQuantity } from "@/lib/utils";

type Tx = Prisma.TransactionClient;

type VariantWithProduct = ProductVariant & { product: Product };

export async function recordStockMovement(
  tx: Tx,
  data: {
    companyId: string;
    productVariantId: string;
    userId?: string;
    type: StockMovementType;
    quantity: number;
    referenceType?: string;
    referenceId?: string;
    notes?: string;
  },
) {
  return tx.stockMovement.create({ data });
}

export async function getVariantForUpdate(
  tx: Tx,
  productVariantId: string,
  companyId: string,
): Promise<VariantWithProduct> {
  const variant = await tx.productVariant.findFirst({
    where: { id: productVariantId, companyId },
    include: { product: true },
  });

  if (!variant) {
    throw new Error("Variación de producto no encontrada.");
  }

  return variant;
}

export function getVariantDisplayName(variant: VariantWithProduct) {
  return formatVariantDisplayName(variant.product.name, variant.label);
}

export function ensureAvailable(variant: ProductVariant, quantity: number, displayName: string) {
  const available = getAvailableQuantity(variant);

  if (quantity > available) {
    throw new Error(
      `Stock insuficiente para "${displayName}". Disponible: ${available}, solicitado: ${quantity}.`,
    );
  }
}

export async function reserveForSale(
  tx: Tx,
  params: {
    companyId: string;
    productVariantId: string;
    quantity: number;
    userId?: string;
    referenceId: string;
  },
) {
  const variant = await getVariantForUpdate(tx, params.productVariantId, params.companyId);
  const displayName = getVariantDisplayName(variant);
  ensureAvailable(variant, params.quantity, displayName);

  await tx.productVariant.update({
    where: { id: variant.id },
    data: { quantityReserved: { increment: params.quantity } },
  });

  await recordStockMovement(tx, {
    companyId: params.companyId,
    productVariantId: params.productVariantId,
    userId: params.userId,
    type: "SALE_PRESALE",
    quantity: params.quantity,
    referenceType: "SaleOrder",
    referenceId: params.referenceId,
  });
}

export async function completeSale(
  tx: Tx,
  params: {
    companyId: string;
    productVariantId: string;
    quantity: number;
    userId?: string;
    referenceId: string;
  },
) {
  const variant = await getVariantForUpdate(tx, params.productVariantId, params.companyId);
  const displayName = getVariantDisplayName(variant);

  if (variant.quantityReserved < params.quantity) {
    throw new Error(`Reserva insuficiente para "${displayName}".`);
  }

  await tx.productVariant.update({
    where: { id: variant.id },
    data: {
      quantityReserved: { decrement: params.quantity },
      quantityTotal: { decrement: params.quantity },
    },
  });

  await recordStockMovement(tx, {
    companyId: params.companyId,
    productVariantId: params.productVariantId,
    userId: params.userId,
    type: "SALE_COMPLETE",
    quantity: params.quantity,
    referenceType: "SaleOrder",
    referenceId: params.referenceId,
  });
}

export async function cancelSaleReservation(
  tx: Tx,
  params: {
    companyId: string;
    productVariantId: string;
    quantity: number;
    userId?: string;
    referenceId: string;
  },
) {
  const variant = await getVariantForUpdate(tx, params.productVariantId, params.companyId);
  const displayName = getVariantDisplayName(variant);

  if (variant.quantityReserved < params.quantity) {
    throw new Error(`Reserva insuficiente para cancelar "${displayName}".`);
  }

  await tx.productVariant.update({
    where: { id: variant.id },
    data: { quantityReserved: { decrement: params.quantity } },
  });

  await recordStockMovement(tx, {
    companyId: params.companyId,
    productVariantId: params.productVariantId,
    userId: params.userId,
    type: "SALE_CANCEL",
    quantity: params.quantity,
    referenceType: "SaleOrder",
    referenceId: params.referenceId,
  });
}

export async function rentOutProducts(
  tx: Tx,
  params: {
    companyId: string;
    productVariantId: string;
    quantity: number;
    userId?: string;
    referenceId: string;
  },
) {
  const variant = await getVariantForUpdate(tx, params.productVariantId, params.companyId);
  const displayName = getVariantDisplayName(variant);
  ensureAvailable(variant, params.quantity, displayName);

  await tx.productVariant.update({
    where: { id: variant.id },
    data: { quantityRented: { increment: params.quantity } },
  });

  await recordStockMovement(tx, {
    companyId: params.companyId,
    productVariantId: params.productVariantId,
    userId: params.userId,
    type: "RENTAL_OUT",
    quantity: params.quantity,
    referenceType: "RentalOrder",
    referenceId: params.referenceId,
  });
}

export async function returnRentalProducts(
  tx: Tx,
  params: {
    companyId: string;
    productVariantId: string;
    quantityReturned: number;
    quantityMissing: number;
    userId?: string;
    referenceId: string;
  },
) {
  const variant = await getVariantForUpdate(tx, params.productVariantId, params.companyId);
  const displayName = getVariantDisplayName(variant);
  const total = params.quantityReturned + params.quantityMissing;

  if (variant.quantityRented < total) {
    throw new Error(`Cantidad en alquiler insuficiente para "${displayName}".`);
  }

  await tx.productVariant.update({
    where: { id: variant.id },
    data: {
      quantityRented: { decrement: total },
      quantityTotal: { decrement: params.quantityMissing },
    },
  });

  if (params.quantityReturned > 0) {
    await recordStockMovement(tx, {
      companyId: params.companyId,
      productVariantId: params.productVariantId,
      userId: params.userId,
      type: "RENTAL_RETURN",
      quantity: params.quantityReturned,
      referenceType: "RentalOrder",
      referenceId: params.referenceId,
    });
  }

  if (params.quantityMissing > 0) {
    await recordStockMovement(tx, {
      companyId: params.companyId,
      productVariantId: params.productVariantId,
      userId: params.userId,
      type: "RENTAL_MISSING",
      quantity: params.quantityMissing,
      referenceType: "RentalOrder",
      referenceId: params.referenceId,
      notes: "Faltante en devolución",
    });
  }
}

export async function cancelRental(
  tx: Tx,
  params: {
    companyId: string;
    productVariantId: string;
    quantity: number;
    userId?: string;
    referenceId: string;
  },
) {
  const variant = await getVariantForUpdate(tx, params.productVariantId, params.companyId);
  const displayName = getVariantDisplayName(variant);

  if (variant.quantityRented < params.quantity) {
    throw new Error(`Cantidad en alquiler insuficiente para cancelar "${displayName}".`);
  }

  await tx.productVariant.update({
    where: { id: variant.id },
    data: { quantityRented: { decrement: params.quantity } },
  });

  await recordStockMovement(tx, {
    companyId: params.companyId,
    productVariantId: params.productVariantId,
    userId: params.userId,
    type: "RENTAL_CANCEL",
    quantity: params.quantity,
    referenceType: "RentalOrder",
    referenceId: params.referenceId,
  });
}

export async function generateVariantSku(companyId: string) {
  const count = await prisma.productVariant.count({ where: { companyId } });
  return formatVariantSku(count + 1);
}

export function formatVariantSku(sequence: number) {
  return `PRD-${String(sequence).padStart(4, "0")}`;
}

// Compatibilidad temporal con imports antiguos.
export const generateProductCode = generateVariantSku;
export const formatProductCode = formatVariantSku;
