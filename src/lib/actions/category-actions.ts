"use server";

import { prisma } from "@/lib/db";
import { assertPermission } from "@/lib/permissions";
import {
  normalizeCategoryName,
  type ProductCategoryOption,
} from "@/lib/products/categories";
import type { ProductCatalogType } from "@/lib/products/catalog";
import { revalidateProductPaths } from "@/lib/products/revalidate-paths";
import { getCompanyContext } from "@/lib/tenant";
import { productCategorySchema, updateProductCategorySchema } from "@/lib/validators";

export async function getProductCategories(
  catalogType: ProductCatalogType,
): Promise<ProductCategoryOption[]> {
  const { companyId } = await getCompanyContext();

  const categories = await prisma.productCategory.findMany({
    where: {
      companyId: companyId!,
      type: catalogType,
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return categories;
}

export async function createProductCategoryAction(formData: FormData) {
  try {
    const { companyId, permissions } = await getCompanyContext();
    assertPermission(permissions, "canManageProducts");

    const parsed = productCategorySchema.safeParse({
      name: formData.get("name"),
      catalogType: formData.get("catalogType"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const normalizedName = normalizeCategoryName(parsed.data.name);

    const existing = await prisma.productCategory.findFirst({
      where: {
        companyId: companyId!,
        type: parsed.data.catalogType,
        normalizedName,
      },
      select: { name: true },
    });

    if (existing) {
      return { error: `Ya existe la categoría "${existing.name}".` };
    }

    const category = await prisma.productCategory.create({
      data: {
        companyId: companyId!,
        name: parsed.data.name.trim(),
        normalizedName,
        type: parsed.data.catalogType,
      },
      select: { id: true, name: true },
    });

    revalidateProductPaths();
    return { success: true, category };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Error al crear categoría",
    };
  }
}

export async function updateProductCategoryAction(formData: FormData) {
  try {
    const { companyId, permissions } = await getCompanyContext();
    assertPermission(permissions, "canManageProducts");

    const parsed = updateProductCategorySchema.safeParse({
      categoryId: formData.get("categoryId"),
      name: formData.get("name"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const category = await prisma.productCategory.findFirst({
      where: { id: parsed.data.categoryId, companyId: companyId! },
    });

    if (!category) {
      return { error: "Categoría no encontrada" };
    }

    const normalizedName = normalizeCategoryName(parsed.data.name);

    const duplicate = await prisma.productCategory.findFirst({
      where: {
        companyId: companyId!,
        type: category.type,
        normalizedName,
        NOT: { id: category.id },
      },
      select: { name: true },
    });

    if (duplicate) {
      return { error: `Ya existe la categoría "${duplicate.name}".` };
    }

    const updated = await prisma.productCategory.update({
      where: { id: category.id },
      data: {
        name: parsed.data.name.trim(),
        normalizedName,
      },
      select: { id: true, name: true },
    });

    revalidateProductPaths();
    return { success: true, category: updated };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Error al actualizar categoría",
    };
  }
}

export async function deleteProductCategoryAction(categoryId: string) {
  try {
    const { companyId, permissions } = await getCompanyContext();
    assertPermission(permissions, "canManageProducts");

    const category = await prisma.productCategory.findFirst({
      where: { id: categoryId, companyId: companyId! },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      return { error: "Categoría no encontrada" };
    }

    if (category._count.products > 0) {
      return {
        error: `No se puede eliminar: ${category._count.products} producto(s) la usan.`,
      };
    }

    await prisma.productCategory.delete({
      where: { id: category.id },
    });

    revalidateProductPaths();
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Error al eliminar categoría",
    };
  }
}
