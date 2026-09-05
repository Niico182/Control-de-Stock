import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { normalizeCategoryName } from "../src/lib/products/categories";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const categories = await prisma.productCategory.findMany({
    orderBy: { createdAt: "asc" },
  });

  let updated = 0;
  let skipped = 0;

  for (const category of categories) {
    const normalizedName = normalizeCategoryName(category.name);

    if (normalizedName === category.normalizedName) {
      continue;
    }

    const conflict = await prisma.productCategory.findFirst({
      where: {
        companyId: category.companyId,
        type: category.type,
        normalizedName,
        NOT: { id: category.id },
      },
      select: { name: true },
    });

    if (conflict) {
      console.warn(
        `Omitida "${category.name}": ya existe "${conflict.name}" con el mismo nombre normalizado.`,
      );
      skipped += 1;
      continue;
    }

    await prisma.productCategory.update({
      where: { id: category.id },
      data: { normalizedName },
    });
    updated += 1;
    console.log(`Actualizada: "${category.name}" → ${normalizedName}`);
  }

  console.log(`Listo. ${updated} actualizada(s), ${skipped} omitida(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
