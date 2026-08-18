import type {
  Prisma,
  Product,
  StockMovementType,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { getAvailableQuantity } from "@/lib/utils";

type Tx = Prisma.TransactionClient;

export async function recordStockMovement(
  tx: Tx,
  data: {
    companyId: string;
    productId: string;
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

export async function getProductForUpdate(tx: Tx, productId: string, companyId: string) {
  const product = await tx.product.findFirst({
    where: { id: productId, companyId },
  });

  if (!product) {
    throw new Error("Producto no encontrado.");
  }

  return product;
}

export function ensureAvailable(product: Product, quantity: number) {
  const available = getAvailableQuantity(product);

  if (quantity > available) {
    throw new Error(
      `Stock insuficiente para "${product.name}". Disponible: ${available}, solicitado: ${quantity}.`,
    );
  }
}

export async function reserveForSale(
  tx: Tx,
  params: {
    companyId: string;
    productId: string;
    quantity: number;
    userId?: string;
    referenceId: string;
  },
) {
  const product = await getProductForUpdate(tx, params.productId, params.companyId);
  ensureAvailable(product, params.quantity);

  await tx.product.update({
    where: { id: product.id },
    data: { quantityReserved: { increment: params.quantity } },
  });

  await recordStockMovement(tx, {
    companyId: params.companyId,
    productId: params.productId,
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
    productId: string;
    quantity: number;
    userId?: string;
    referenceId: string;
  },
) {
  const product = await getProductForUpdate(tx, params.productId, params.companyId);

  if (product.quantityReserved < params.quantity) {
    throw new Error(`Reserva insuficiente para "${product.name}".`);
  }

  await tx.product.update({
    where: { id: product.id },
    data: {
      quantityReserved: { decrement: params.quantity },
      quantityTotal: { decrement: params.quantity },
    },
  });

  await recordStockMovement(tx, {
    companyId: params.companyId,
    productId: params.productId,
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
    productId: string;
    quantity: number;
    userId?: string;
    referenceId: string;
  },
) {
  const product = await getProductForUpdate(tx, params.productId, params.companyId);

  if (product.quantityReserved < params.quantity) {
    throw new Error(`Reserva insuficiente para cancelar "${product.name}".`);
  }

  await tx.product.update({
    where: { id: product.id },
    data: { quantityReserved: { decrement: params.quantity } },
  });

  await recordStockMovement(tx, {
    companyId: params.companyId,
    productId: params.productId,
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
    productId: string;
    quantity: number;
    userId?: string;
    referenceId: string;
  },
) {
  const product = await getProductForUpdate(tx, params.productId, params.companyId);
  ensureAvailable(product, params.quantity);

  await tx.product.update({
    where: { id: product.id },
    data: { quantityRented: { increment: params.quantity } },
  });

  await recordStockMovement(tx, {
    companyId: params.companyId,
    productId: params.productId,
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
    productId: string;
    quantityReturned: number;
    quantityMissing: number;
    userId?: string;
    referenceId: string;
  },
) {
  const product = await getProductForUpdate(tx, params.productId, params.companyId);
  const total = params.quantityReturned + params.quantityMissing;

  if (product.quantityRented < total) {
    throw new Error(`Cantidad en alquiler insuficiente para "${product.name}".`);
  }

  await tx.product.update({
    where: { id: product.id },
    data: {
      quantityRented: { decrement: total },
      quantityTotal: { decrement: params.quantityMissing },
    },
  });

  if (params.quantityReturned > 0) {
    await recordStockMovement(tx, {
      companyId: params.companyId,
      productId: params.productId,
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
      productId: params.productId,
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
    productId: string;
    quantity: number;
    userId?: string;
    referenceId: string;
  },
) {
  const product = await getProductForUpdate(tx, params.productId, params.companyId);

  if (product.quantityRented < params.quantity) {
    throw new Error(`Cantidad en alquiler insuficiente para cancelar "${product.name}".`);
  }

  await tx.product.update({
    where: { id: product.id },
    data: { quantityRented: { decrement: params.quantity } },
  });

  await recordStockMovement(tx, {
    companyId: params.companyId,
    productId: params.productId,
    userId: params.userId,
    type: "RENTAL_CANCEL",
    quantity: params.quantity,
    referenceType: "RentalOrder",
    referenceId: params.referenceId,
  });
}

export async function generateProductCode(companyId: string) {
  const count = await prisma.product.count({ where: { companyId } });
  return formatProductCode(count + 1);
}

export function formatProductCode(sequence: number) {
  return `PRD-${String(sequence).padStart(4, "0")}`;
}
