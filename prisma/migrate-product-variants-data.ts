import "dotenv/config";
import { randomUUID } from "crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});

const prisma = new PrismaClient({ adapter });

async function tableHasColumn(table: string, column: string) {
  const rows = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
    `PRAGMA table_info("${table}")`,
  );
  return rows.some((row) => row.name === column);
}

async function main() {
  const hasLegacyProductCode = await tableHasColumn("Product", "code");

  if (!hasLegacyProductCode) {
    console.log("La base ya usa variantes. Nada que migrar.");
    return;
  }

  const products = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      companyId: string;
      code: string;
      name: string;
      price: number;
      cost: number | null;
      quantityTotal: number;
      quantityReserved: number;
      quantityRented: number;
      isActive: number;
      createdAt: string;
      updatedAt: string;
    }>
  >(
    `SELECT id, companyId, code, name, price, cost, quantityTotal, quantityReserved, quantityRented, isActive, createdAt, updatedAt FROM "Product"`,
  );

  const productToVariant = new Map<string, string>();

  for (const product of products) {
    const variantId = randomUUID();
    productToVariant.set(product.id, variantId);

    await prisma.$executeRawUnsafe(
      `INSERT INTO "ProductVariant" (
        id, productId, companyId, sku, label, attributes, normalizedAttributes,
        price, cost, quantityTotal, quantityReserved, quantityRented, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?)`,
      variantId,
      product.id,
      product.companyId,
      product.code,
      "Único",
      "{}",
      "",
      product.quantityTotal,
      product.quantityReserved,
      product.quantityRented,
      product.isActive ? 1 : 0,
      product.createdAt,
      product.updatedAt,
    );

    await prisma.$executeRawUnsafe(
      `UPDATE "Product" SET basePrice = ?, baseCost = ? WHERE id = ?`,
      product.price,
      product.cost,
      product.id,
    );
  }

  async function remapTable(table: string) {
    const hasOldColumn = await tableHasColumn(table, "productId");
    const hasNewColumn = await tableHasColumn(table, "productVariantId");

    if (!hasOldColumn || !hasNewColumn) {
      return;
    }

    const rows = await prisma.$queryRawUnsafe<Array<{ id: string; productId: string }>>(
      `SELECT id, productId FROM "${table}"`,
    );

    for (const row of rows) {
      const variantId = productToVariant.get(row.productId);
      if (!variantId) {
        throw new Error(`No se encontró variante para productId ${row.productId}`);
      }

      await prisma.$executeRawUnsafe(
        `UPDATE "${table}" SET productVariantId = ? WHERE id = ?`,
        variantId,
        row.id,
      );
    }
  }

  await remapTable("StockMovement");
  await remapTable("SaleOrderItem");
  await remapTable("RentalOrderItem");
  await remapTable("RentalReturnItem");

  console.log(`Migrados ${products.length} producto(s) a variantes.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
