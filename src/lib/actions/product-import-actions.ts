"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertPermission } from "@/lib/permissions";
import {
  bulkProductRowSchema,
  MAX_BULK_IMPORT_ROWS,
  type BulkProductRow,
} from "@/lib/products/csv-import";
import { formatProductCode, recordStockMovement } from "@/lib/stock";
import { getCompanyContext } from "@/lib/tenant";
import { revalidateProductPaths } from "@/lib/products/revalidate-paths";

export async function importProductsBulkAction(rows: BulkProductRow[]) {
  try {
    const { companyId, session, permissions } = await getCompanyContext();
    assertPermission(permissions, "canManageProducts");

    if (rows.length === 0) {
      return { error: "No hay productos para importar." };
    }

    if (rows.length > MAX_BULK_IMPORT_ROWS) {
      return { error: `Máximo ${MAX_BULK_IMPORT_ROWS} productos por importación.` };
    }

    const parsedRows: BulkProductRow[] = [];

    for (const row of rows) {
      const parsed = bulkProductRowSchema.safeParse(row);
      if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
      }
      parsedRows.push(parsed.data);
    }

    const codes = parsedRows
      .map((row) => row.code?.trim().toUpperCase())
      .filter((code): code is string => Boolean(code));

    if (new Set(codes).size !== codes.length) {
      return { error: "Hay códigos duplicados en el archivo." };
    }

    if (codes.length > 0) {
      const existing = await prisma.product.findMany({
        where: {
          companyId: companyId!,
          code: { in: codes },
        },
        select: { code: true },
      });

      if (existing.length > 0) {
        return {
          error: `Ya existen productos con estos códigos: ${existing.map((item) => item.code).join(", ")}`,
        };
      }
    }

    await prisma.$transaction(async (tx) => {
      const currentCount = await tx.product.count({ where: { companyId: companyId! } });
      let nextSequence = currentCount + 1;

      for (const row of parsedRows) {
        const code = row.code?.trim().toUpperCase() ?? formatProductCode(nextSequence++);

        const product = await tx.product.create({
          data: {
            companyId: companyId!,
            code,
            name: row.name.trim(),
            price: row.price,
            quantityTotal: row.quantity,
            type: row.type,
          },
        });

        if (row.quantity > 0) {
          await recordStockMovement(tx, {
            companyId: companyId!,
            productId: product.id,
            userId: session.user.id,
            type: "INITIAL",
            quantity: row.quantity,
            notes: "Importación CSV",
          });
        }
      }
    });

    revalidateProductPaths();
    return { success: true, imported: parsedRows.length };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Error al importar productos",
    };
  }
}
