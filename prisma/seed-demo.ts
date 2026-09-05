import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { RENTAL_CATALOG } from "./rental-catalog";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});

const prisma = new PrismaClient({ adapter });

const DEMO = {
  companyName: "Empresa Demo",
  slug: "empresa-demo",
  adminEmail: "demo@controlstock.app",
  adminPassword: "Demo123!",
  adminName: "Admin Demo",
};

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: DEMO.adminEmail },
  });

  if (existing) {
    console.log("La cuenta demo ya existe.");
    console.log("Email:", DEMO.adminEmail);
    console.log("Password:", DEMO.adminPassword);
    console.log("");
    console.log("Para resetear el catálogo de alquiler: npm run db:reset-rental-demo");
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO.adminPassword, 12);

  await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: DEMO.companyName,
        slug: DEMO.slug,
        enableSales: true,
        enableRentals: true,
        currency: "ARS",
      },
    });

    const admin = await tx.user.create({
      data: {
        email: DEMO.adminEmail,
        name: DEMO.adminName,
        passwordHash,
        role: "ADMIN",
      },
    });

    await tx.companyMember.create({
      data: {
        userId: admin.id,
        companyId: company.id,
        canManageProducts: true,
        canCreateOrders: true,
        canViewReports: true,
        canManageMembers: true,
      },
    });

    for (const item of RENTAL_CATALOG) {
      const product = await tx.product.create({
        data: {
          companyId: company.id,
          name: item.name,
          basePrice: item.price,
          type: "RENTAL",
        },
      });

      const variant = await tx.productVariant.create({
        data: {
          productId: product.id,
          companyId: company.id,
          sku: item.code,
          label: "Único",
          quantityTotal: item.quantity,
        },
      });

      await tx.stockMovement.create({
        data: {
          companyId: company.id,
          productVariantId: variant.id,
          userId: admin.id,
          type: "INITIAL",
          quantity: item.quantity,
          notes: "Stock inicial demo",
        },
      });
    }
  });

  console.log("Cuenta demo creada correctamente.");
  console.log("");
  console.log("Empresa:", DEMO.companyName);
  console.log("Email:", DEMO.adminEmail);
  console.log("Password:", DEMO.adminPassword);
  console.log("");
  console.log(`Productos de alquiler cargados: ${RENTAL_CATALOG.length}`);
  console.log("Login: http://localhost:3001/login");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
