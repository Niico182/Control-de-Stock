"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { assertPermission } from "@/lib/permissions";
import {
  generateProductCode,
  recordStockMovement,
} from "@/lib/stock";
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

export async function createProductAction(formData: FormData) {
  try {
    const { companyId, session, permissions } = await getCompanyContext();
    assertPermission(permissions, "canManageProducts");

    const parsed = productSchema.safeParse({
      name: formData.get("name"),
      price: formData.get("price"),
      quantity: formData.get("quantity"),
      type: formData.get("type"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const code = await generateProductCode(companyId!);

    await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          companyId: companyId!,
          code,
          name: parsed.data.name,
          price: parsed.data.price,
          quantityTotal: parsed.data.quantity,
          type: parsed.data.type,
        },
      });

      if (parsed.data.quantity > 0) {
        await recordStockMovement(tx, {
          companyId: companyId!,
          productId: product.id,
          userId: session.user.id,
          type: "INITIAL",
          quantity: parsed.data.quantity,
          notes: "Stock inicial",
        });
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

    const parsed = updateProductSchema.safeParse({
      productId: formData.get("productId"),
      name: formData.get("name"),
      price: formData.get("price"),
      quantity: formData.get("quantity"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const product = await prisma.product.findFirst({
      where: { id: parsed.data.productId, companyId: companyId! },
    });

    if (!product) {
      return { error: "Producto no encontrado" };
    }

    const minQuantity = product.quantityReserved + product.quantityRented;

    if (parsed.data.quantity < minQuantity) {
      return {
        error: `La cantidad no puede ser menor a ${minQuantity} (reservado + alquilado).`,
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: product.id },
        data: {
          name: parsed.data.name,
          price: parsed.data.price,
          quantityTotal: parsed.data.quantity,
        },
      });

      const quantityDiff = parsed.data.quantity - product.quantityTotal;

      if (quantityDiff !== 0) {
        await recordStockMovement(tx, {
          companyId: companyId!,
          productId: product.id,
          userId: session.user.id,
          type: "ADJUSTMENT",
          quantity: Math.abs(quantityDiff),
          notes:
            quantityDiff > 0
              ? "Ajuste manual: incremento de stock"
              : "Ajuste manual: reducción de stock",
        });
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
