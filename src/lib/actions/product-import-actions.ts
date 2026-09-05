"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertPermission } from "@/lib/permissions";
import {
  bulkProductRowSchema,
  MAX_BULK_IMPORT_ROWS,
  type BulkProductRow,
} from "@/lib/products/csv-import";
import { normalizeCategoryName } from "@/lib/products/categories";
import { resolveVariantDrafts } from "@/lib/products/variants";
import { formatVariantSku, recordStockMovement } from "@/lib/stock";
import { getCompanyContext } from "@/lib/tenant";
import { revalidateProductPaths } from "@/lib/products/revalidate-paths";

type ImportRow = BulkProductRow & { rowNumber: number };

function groupImportRows(rows: ImportRow[]) {
  const groups = new Map<string, ImportRow[]>();

  for (const row of rows) {
    const key = [
      row.type,
      row.categoryId ?? "",
      normalizeCategoryName(row.name),
    ].join("|");

    const current = groups.get(key) ?? [];
    current.push(row);
    groups.set(key, current);
  }

  return Array.from(groups.values());
}

export async function importProductsBulkAction(rows: ImportRow[]) {
  try {
    const { companyId, session, permissions } = await getCompanyContext();
    assertPermission(permissions, "canManageProducts");

    if (rows.length === 0) {
      return { error: "No hay productos para importar." };
    }

    if (rows.length > MAX_BULK_IMPORT_ROWS) {
      return { error: `Máximo ${MAX_BULK_IMPORT_ROWS} productos por importación.` };
    }

    const parsedRows: ImportRow[] = [];

    for (const row of rows) {
      const parsed = bulkProductRowSchema.safeParse(row);
      if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
      }
      parsedRows.push({ ...parsed.data, rowNumber: row.rowNumber });
    }

    const skus = parsedRows
      .map((row) => row.sku?.trim().toUpperCase())
      .filter((sku): sku is string => Boolean(sku));

    if (new Set(skus).size !== skus.length) {
      return { error: "Hay códigos SKU duplicados en el archivo." };
    }

    if (skus.length > 0) {
      const existing = await prisma.productVariant.findMany({
        where: {
          companyId: companyId!,
          sku: { in: skus },
        },
        select: { sku: true },
      });

      if (existing.length > 0) {
        return {
          error: `Ya existen variaciones con estos códigos: ${existing.map((item) => item.sku).join(", ")}`,
        };
      }
    }

    const groups = groupImportRows(parsedRows);
    let importedVariants = 0;

    await prisma.$transaction(async (tx) => {
      let nextSequence = (await tx.productVariant.count({ where: { companyId: companyId! } })) + 1;

      for (const group of groups) {
        const first = group[0];
        const resolved = resolveVariantDrafts(
          group.map((row) => ({
            color: row.color,
            quantity: row.quantity,
            price: row.variantPrice ?? (row.basePrice !== first.basePrice ? row.basePrice : null),
            cost: row.cost,
            sku: row.sku,
            isActive: row.isActive,
          })),
        );

        if (resolved.error || !resolved.variants) {
          throw new Error(`${first.name}: ${resolved.error ?? "Datos inválidos"}`);
        }

        const variantDrafts = resolved.variants;

        const product = await tx.product.create({
          data: {
            companyId: companyId!,
            name: first.name.trim(),
            categoryId: first.categoryId ?? null,
            description: first.description?.trim() || null,
            basePrice: first.basePrice,
            baseCost: first.cost ?? null,
            type: first.type,
            isActive: first.isActive,
          },
        });

        for (const variant of variantDrafts) {
          const sku = variant.sku ?? formatVariantSku(nextSequence++);
          const sourceRow = group.find((row) => row.color?.trim() === variant.label || (!row.color && variant.label === "Único"));

          const createdVariant = await tx.productVariant.create({
            data: {
              productId: product.id,
              companyId: companyId!,
              sku,
              label: variant.label,
              attributes: variant.attributes,
              normalizedAttributes: variant.normalizedAttributes,
              price: variant.price,
              cost: variant.cost,
              quantityTotal: variant.quantity,
              isActive: variant.isActive,
            },
          });

          if (variant.quantity > 0) {
            await recordStockMovement(tx, {
              companyId: companyId!,
              productVariantId: createdVariant.id,
              userId: session.user.id,
              type: "INITIAL",
              quantity: variant.quantity,
              notes: sourceRow
                ? `Importación CSV (fila ${sourceRow.rowNumber})`
                : "Importación CSV",
            });
          }

          importedVariants += 1;
        }
      }
    });

    revalidateProductPaths();
    return { success: true, imported: importedVariants, products: groups.length };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Error al importar productos",
    };
  }
}
