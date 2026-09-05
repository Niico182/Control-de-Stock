"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { assertPermission } from "@/lib/permissions";
import {
  formatVariantSku,
  recordStockMovement,
} from "@/lib/stock";
import { resolveVariantDrafts } from "@/lib/products/variants";
import { getCompanyContext, requireSuperuser } from "@/lib/tenant";
import {
  acceptInviteSchema,
  companySettingsSchema,
  createCompanySchema,
  inviteEmployeeSchema,
  productSchema,
  updateProductSchema,
} from "@/lib/validators";
import { slugify } from "@/lib/utils";
import { revalidateProductPaths } from "@/lib/products/revalidate-paths";
import type { ProductCatalogType } from "@/lib/products/catalog";
import type { ProductEditData } from "@/components/products/product-edit-dialog";

export async function createProductAction(formData: FormData) {
  try {
    const { companyId, session, permissions } = await getCompanyContext();
    assertPermission(permissions, "canManageProducts");

    const variantsRaw = formData.get("variants");
    const variants = variantsRaw ? JSON.parse(String(variantsRaw)) : [];

    const parsed = productSchema.safeParse({
      name: formData.get("name"),
      basePrice: formData.get("basePrice"),
      type: formData.get("type"),
      categoryId: formData.get("categoryId") || undefined,
      description: formData.get("description") || undefined,
      baseCost: formData.get("baseCost") || undefined,
      isActive: formData.get("isActive") || undefined,
      variants,
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    if (parsed.data.categoryId) {
      const category = await prisma.productCategory.findFirst({
        where: {
          id: parsed.data.categoryId,
          companyId: companyId!,
          type: parsed.data.type,
        },
        select: { id: true },
      });

      if (!category) {
        return { error: "La categoría seleccionada no es válida." };
      }
    }

    const resolved = resolveVariantDrafts(parsed.data.variants);
    if (resolved.error || !resolved.variants) {
      return { error: resolved.error ?? "Datos inválidos" };
    }

    const variantDrafts = resolved.variants;

    const skus = variantDrafts
      .map((variant) => variant.sku)
      .filter((sku): sku is string => Boolean(sku));

    if (new Set(skus).size !== skus.length) {
      return { error: "Hay códigos SKU duplicados entre las variaciones." };
    }

    if (skus.length > 0) {
      const existing = await prisma.productVariant.findMany({
        where: { companyId: companyId!, sku: { in: skus } },
        select: { sku: true },
      });

      if (existing.length > 0) {
        return {
          error: `Ya existen variaciones con estos códigos: ${existing.map((item) => item.sku).join(", ")}`,
        };
      }
    }

    await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          companyId: companyId!,
          name: parsed.data.name,
          categoryId: parsed.data.categoryId,
          description: parsed.data.description,
          basePrice: parsed.data.basePrice,
          baseCost: parsed.data.baseCost,
          type: parsed.data.type,
          isActive: parsed.data.isActive,
        },
      });

      let nextSequence = (await tx.productVariant.count({ where: { companyId: companyId! } })) + 1;

      for (const variant of variantDrafts) {
        const sku = variant.sku ?? formatVariantSku(nextSequence++);

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
            notes: "Stock inicial",
          });
        }
      }
    });

    revalidateProductPaths();
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Error al crear producto" };
  }
}

export async function updateProductAction(formData: FormData) {
  try {
    const { companyId, session, permissions } = await getCompanyContext();
    assertPermission(permissions, "canManageProducts");

    const variantsRaw = formData.get("variants");
    const variants = variantsRaw ? JSON.parse(String(variantsRaw)) : [];

    const parsed = updateProductSchema.safeParse({
      productId: formData.get("productId"),
      name: formData.get("name"),
      basePrice: formData.get("basePrice"),
      categoryId: formData.get("categoryId") || undefined,
      description: formData.get("description") || undefined,
      baseCost: formData.get("baseCost") || undefined,
      isActive: formData.get("isActive"),
      variants,
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const product = await prisma.product.findFirst({
      where: { id: parsed.data.productId, companyId: companyId! },
      include: { variants: true },
    });

    if (!product) {
      return { error: "Producto no encontrado" };
    }

    if (parsed.data.categoryId) {
      const category = await prisma.productCategory.findFirst({
        where: {
          id: parsed.data.categoryId,
          companyId: companyId!,
          type: product.type,
        },
        select: { id: true },
      });

      if (!category) {
        return { error: "La categoría seleccionada no es válida." };
      }
    }

    const resolved = resolveVariantDrafts(parsed.data.variants);
    if (resolved.error || !resolved.variants) {
      return { error: resolved.error ?? "Datos inválidos" };
    }

    const variantDrafts = resolved.variants;

    const existingById = new Map(product.variants.map((variant) => [variant.id, variant]));
    const incomingIds = new Set(
      variantDrafts.map((variant) => variant.id).filter((id): id is string => Boolean(id)),
    );

    if (incomingIds.size !== variantDrafts.filter((variant) => variant.id).length) {
      return { error: "Hay variaciones duplicadas." };
    }

    for (const variantId of incomingIds) {
      if (!existingById.has(variantId)) {
        return { error: "Una de las variaciones no pertenece a este producto." };
      }
    }

    const removedVariants = product.variants.filter((variant) => !incomingIds.has(variant.id));
    if (removedVariants.some((variant) => variant.quantityReserved + variant.quantityRented > 0)) {
      return { error: "No se pueden quitar variaciones con stock reservado o alquilado." };
    }

    const skus = variantDrafts
      .map((variant) => variant.sku)
      .filter((sku): sku is string => Boolean(sku));

    if (new Set(skus).size !== skus.length) {
      return { error: "Hay códigos SKU duplicados entre las variaciones." };
    }

    if (skus.length > 0) {
      const conflicts = await prisma.productVariant.findMany({
        where: {
          companyId: companyId!,
          sku: { in: skus },
          NOT: { productId: product.id },
        },
        select: { sku: true },
      });

      if (conflicts.length > 0) {
        return {
          error: `Ya existen variaciones con estos códigos: ${conflicts.map((item) => item.sku).join(", ")}`,
        };
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: product.id },
        data: {
          name: parsed.data.name,
          categoryId: parsed.data.categoryId,
          description: parsed.data.description,
          basePrice: parsed.data.basePrice,
          baseCost: parsed.data.baseCost,
          isActive: parsed.data.isActive,
        },
      });

      let nextSequence = (await tx.productVariant.count({ where: { companyId: companyId! } })) + 1;

      for (const removed of removedVariants) {
        await tx.productVariant.delete({ where: { id: removed.id } });
      }

      for (const variant of variantDrafts) {
        if (variant.id) {
          const current = existingById.get(variant.id)!;
          const minQuantity = current.quantityReserved + current.quantityRented;

          if (variant.quantity < minQuantity) {
            throw new Error(
              `La variación "${variant.label}" no puede tener menos de ${minQuantity} unidades (reservado + alquilado).`,
            );
          }

          await tx.productVariant.update({
            where: { id: current.id },
            data: {
              sku: variant.sku ?? current.sku,
              label: variant.label,
              attributes: variant.attributes,
              normalizedAttributes: variant.normalizedAttributes,
              price: variant.price,
              cost: variant.cost,
              quantityTotal: variant.quantity,
              isActive: variant.isActive,
            },
          });

          const quantityDiff = variant.quantity - current.quantityTotal;

          if (quantityDiff !== 0) {
            await recordStockMovement(tx, {
              companyId: companyId!,
              productVariantId: current.id,
              userId: session.user.id,
              type: "ADJUSTMENT",
              quantity: Math.abs(quantityDiff),
              notes:
                quantityDiff > 0
                  ? "Ajuste manual: incremento de stock"
                  : "Ajuste manual: reducción de stock",
            });
          }

          continue;
        }

        const sku = variant.sku ?? formatVariantSku(nextSequence++);

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
            notes: "Stock inicial de variación",
          });
        }
      }
    });

    revalidateProductPaths();
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Error al actualizar producto" };
  }
}

export async function deleteProductAction(productId: string) {
  try {
    const { companyId, permissions } = await getCompanyContext();
    assertPermission(permissions, "canManageProducts");

    await prisma.product.deleteMany({
      where: { id: productId, companyId: companyId! },
    });

    revalidateProductPaths();
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Error al eliminar producto" };
  }
}

export async function getProductForEditAction(productId: string) {
  try {
    const { companyId, permissions } = await getCompanyContext();
    assertPermission(permissions, "canManageProducts");

    const product = await prisma.product.findFirst({
      where: { id: productId, companyId: companyId! },
      include: {
        variants: {
          orderBy: { label: "asc" },
        },
      },
    });

    if (!product) {
      return { error: "Producto no encontrado" };
    }

    return {
      product: {
        id: product.id,
        name: product.name,
        categoryId: product.categoryId,
        description: product.description,
        basePrice: Number(product.basePrice),
        baseCost: product.baseCost != null ? Number(product.baseCost) : null,
        type: product.type as ProductCatalogType,
        isActive: product.isActive,
        variants: product.variants.map((variant) => ({
          id: variant.id,
          sku: variant.sku,
          label: variant.label,
          attributes: variant.attributes,
          price: variant.price != null ? Number(variant.price) : null,
          cost: variant.cost != null ? Number(variant.cost) : null,
          quantityTotal: variant.quantityTotal,
          quantityReserved: variant.quantityReserved,
          quantityRented: variant.quantityRented,
          isActive: variant.isActive,
        })),
      } satisfies ProductEditData,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Error al cargar producto" };
  }
}

export async function updateCompanySettingsAction(formData: FormData) {
  try {
    const { companyId, permissions } = await getCompanyContext();
    assertPermission(permissions, "canManageMembers");

    const parsed = companySettingsSchema.safeParse({
      name: formData.get("name"),
      enableSales: formData.get("enableSales") === "on",
      enableRentals: formData.get("enableRentals") === "on",
    });

    if (!parsed.success) {
      return { error: "Datos inválidos" };
    }

    await prisma.company.update({
      where: { id: companyId! },
      data: parsed.data,
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Error al guardar configuración" };
  }
}

export async function inviteEmployeeAction(formData: FormData) {
  try {
    const { companyId, session, permissions } = await getCompanyContext();
    assertPermission(permissions, "canManageMembers");

    const parsed = inviteEmployeeSchema.safeParse({
      email: formData.get("email"),
      canManageProducts: formData.get("canManageProducts") === "on",
      canCreateOrders: formData.get("canCreateOrders") === "on",
      canViewReports: formData.get("canViewReports") === "on",
      canManageMembers: formData.get("canManageMembers") === "on",
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.invitation.create({
      data: {
        email: parsed.data.email.toLowerCase(),
        companyId: companyId!,
        token,
        invitedById: session.user.id,
        expiresAt,
        canManageProducts: parsed.data.canManageProducts,
        canCreateOrders: parsed.data.canCreateOrders,
        canViewReports: parsed.data.canViewReports,
        canManageMembers: parsed.data.canManageMembers,
      },
    });

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;

    revalidatePath("/dashboard/team");
    return { success: true, inviteUrl };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Error al invitar empleado" };
  }
}

export async function acceptInviteAction(formData: FormData) {
  try {
    const parsed = acceptInviteSchema.safeParse({
      token: formData.get("token"),
      name: formData.get("name"),
      password: formData.get("password"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token: parsed.data.token },
      include: { company: true },
    });

    if (!invitation || invitation.usedAt || invitation.expiresAt < new Date()) {
      return { error: "Invitación inválida o expirada" };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      return { error: "Ya existe una cuenta con ese email" };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: invitation.email,
          name: parsed.data.name,
          passwordHash,
          role: "EMPLOYEE",
        },
      });

      await tx.companyMember.create({
        data: {
          userId: user.id,
          companyId: invitation.companyId,
          canManageProducts: invitation.canManageProducts,
          canCreateOrders: invitation.canCreateOrders,
          canViewReports: invitation.canViewReports,
          canManageMembers: invitation.canManageMembers,
        },
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { usedAt: new Date() },
      });
    });

    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Error al aceptar invitación" };
  }
}

export async function createCompanyAction(formData: FormData) {
  try {
    await requireSuperuser();

    const parsed = createCompanySchema.safeParse({
      companyName: formData.get("companyName"),
      adminName: formData.get("adminName"),
      adminEmail: formData.get("adminEmail"),
      adminPassword: formData.get("adminPassword"),
      enableSales: formData.get("enableSales") === "on",
      enableRentals: formData.get("enableRentals") === "on",
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const email = parsed.data.adminEmail.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      return { error: "Ya existe un usuario con ese email" };
    }

    const passwordHash = await bcrypt.hash(parsed.data.adminPassword, 12);
    const baseSlug = slugify(parsed.data.companyName);
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.company.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: parsed.data.companyName,
          slug,
          enableSales: parsed.data.enableSales,
          enableRentals: parsed.data.enableRentals,
        },
      });

      const admin = await tx.user.create({
        data: {
          email,
          name: parsed.data.adminName,
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
    });

    revalidatePath("/superadmin/companies");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Error al crear empresa" };
  }
}

export async function toggleCompanyActiveAction(companyId: string, isActive: boolean) {
  try {
    await requireSuperuser();

    await prisma.company.update({
      where: { id: companyId },
      data: { isActive },
    });

    revalidatePath("/superadmin/companies");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Error al actualizar empresa" };
  }
}
