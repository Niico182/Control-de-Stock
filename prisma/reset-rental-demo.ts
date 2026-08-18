import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { RENTAL_CATALOG } from "./rental-catalog";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});

const prisma = new PrismaClient({ adapter });

const DEMO_SLUG = "empresa-demo";
const DEMO_ADMIN_EMAIL = "demo@controlstock.app";

async function main() {
  const company = await prisma.company.findUnique({
    where: { slug: DEMO_SLUG },
  });

  if (!company) {
    console.error(`No se encontró la empresa con slug "${DEMO_SLUG}".`);
    console.error("Ejecutá primero: npm run db:seed-demo");
    process.exit(1);
  }

  const admin = await prisma.user.findUnique({
    where: { email: DEMO_ADMIN_EMAIL },
  });

  const rentalOrderIds = (
    await prisma.rentalOrder.findMany({
      where: { companyId: company.id },
      select: { id: true },
    })
  ).map((order) => order.id);

  const saleOrderIds = (
    await prisma.saleOrder.findMany({
      where: { companyId: company.id },
      select: { id: true },
    })
  ).map((order) => order.id);

  const productIds = (
    await prisma.product.findMany({
      where: { companyId: company.id },
      select: { id: true },
    })
  ).map((product) => product.id);

  await prisma.$transaction(async (tx) => {
    if (rentalOrderIds.length > 0) {
      await tx.rentalReturnItem.deleteMany({
        where: { rentalReturn: { rentalOrderId: { in: rentalOrderIds } } },
      });
      await tx.rentalReturn.deleteMany({
        where: { rentalOrderId: { in: rentalOrderIds } },
      });
      await tx.rentalOrderItem.deleteMany({
        where: { rentalOrderId: { in: rentalOrderIds } },
      });
      await tx.rentalOrder.deleteMany({
        where: { companyId: company.id },
      });
    }

    if (saleOrderIds.length > 0) {
      await tx.saleOrderItem.deleteMany({
        where: { saleOrderId: { in: saleOrderIds } },
      });
      await tx.saleOrder.deleteMany({
        where: { companyId: company.id },
      });
    }

    if (productIds.length > 0) {
      await tx.stockMovement.deleteMany({
        where: { productId: { in: productIds } },
      });
      await tx.product.deleteMany({
        where: { companyId: company.id },
      });
    }

    for (const item of RENTAL_CATALOG) {
      const product = await tx.product.create({
        data: {
          companyId: company.id,
          code: item.code,
          name: item.name,
          price: item.price,
          quantityTotal: item.quantity,
          type: "RENTAL",
        },
      });

      await tx.stockMovement.create({
        data: {
          companyId: company.id,
          productId: product.id,
          userId: admin?.id,
          type: "INITIAL",
          quantity: item.quantity,
          notes: "Catálogo de alquiler — carga inicial",
        },
      });
    }
  });

  console.log("Listo.");
  console.log(`Empresa: ${company.name}`);
  console.log(`Alquileres eliminados: ${rentalOrderIds.length}`);
  console.log(`Ventas eliminadas: ${saleOrderIds.length}`);
  console.log(`Productos anteriores eliminados: ${productIds.length}`);
  console.log(`Productos de alquiler cargados: ${RENTAL_CATALOG.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
