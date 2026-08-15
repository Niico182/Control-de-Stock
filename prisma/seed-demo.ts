import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

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

    const products = [
      { code: "PRD-0001", name: "Silla plegable", price: 1500, quantity: 20, type: "BOTH" as const },
      { code: "PRD-0002", name: "Mesa recta", price: 3500, quantity: 10, type: "RENTAL" as const },
      { code: "PRD-0003", name: "Mantel blanco", price: 800, quantity: 50, type: "SALE" as const },
      { code: "PRD-0004", name: "Equipo de sonido", price: 12000, quantity: 5, type: "BOTH" as const },
    ];

    for (const product of products) {
      const created = await tx.product.create({
        data: {
          companyId: company.id,
          code: product.code,
          name: product.name,
          price: product.price,
          quantityTotal: product.quantity,
          type: product.type,
        },
      });

      await tx.stockMovement.create({
        data: {
          companyId: company.id,
          productId: created.id,
          userId: admin.id,
          type: "INITIAL",
          quantity: product.quantity,
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
  console.log("Productos cargados: 4 (venta, alquiler y ambos)");
  console.log("Login: http://localhost:3000/login");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
