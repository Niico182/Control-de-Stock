"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertPermission } from "@/lib/permissions";
import {
  cancelSaleReservation,
  completeSale,
  reserveForSale,
} from "@/lib/stock";
import { getCompanyContext } from "@/lib/tenant";
import { saleOrderSchema } from "@/lib/validators";

export async function createSaleAction(formData: FormData) {
  try {
    const { companyId, session, permissions, company } = await getCompanyContext();
    assertPermission(permissions, "canCreateOrders");

    if (!company.enableSales) {
      return { error: "El módulo de ventas no está activo" };
    }

    const itemsRaw = formData.get("items");
    const items = itemsRaw ? JSON.parse(String(itemsRaw)) : [];

    const parsed = saleOrderSchema.safeParse({
      clientName: formData.get("clientName"),
      notes: formData.get("notes") || undefined,
      items,
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const totalPrice = parsed.data.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    await prisma.$transaction(async (tx) => {
      const sale = await tx.saleOrder.create({
        data: {
          companyId: companyId!,
          clientName: parsed.data.clientName,
          notes: parsed.data.notes,
          totalPrice,
          status: "PRESALE",
          items: {
            create: parsed.data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
        include: { items: true },
      });

      for (const item of sale.items) {
        await reserveForSale(tx, {
          companyId: companyId!,
          productId: item.productId,
          quantity: item.quantity,
          userId: session.user.id,
          referenceId: sale.id,
        });
      }
    });

    revalidatePath("/dashboard/sales");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Error al crear venta" };
  }
}

export async function completeSaleAction(saleId: string) {
  try {
    const { companyId, session, permissions } = await getCompanyContext();
    assertPermission(permissions, "canCreateOrders");

    const sale = await prisma.saleOrder.findFirst({
      where: { id: saleId, companyId: companyId!, status: "PRESALE" },
      include: { items: true },
    });

    if (!sale) {
      return { error: "Venta no encontrada" };
    }

    await prisma.$transaction(async (tx) => {
      for (const item of sale.items) {
        await completeSale(tx, {
          companyId: companyId!,
          productId: item.productId,
          quantity: item.quantity,
          userId: session.user.id,
          referenceId: sale.id,
        });
      }

      await tx.saleOrder.update({
        where: { id: sale.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
    });

    revalidatePath("/dashboard/sales");
    revalidatePath("/dashboard/reports");
    revalidatePath("/dashboard/products");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Error al completar venta" };
  }
}

export async function cancelSaleAction(saleId: string) {
  try {
    const { companyId, session, permissions } = await getCompanyContext();
    assertPermission(permissions, "canCreateOrders");

    const sale = await prisma.saleOrder.findFirst({
      where: { id: saleId, companyId: companyId!, status: "PRESALE" },
      include: { items: true },
    });

    if (!sale) {
      return { error: "Venta no encontrada" };
    }

    await prisma.$transaction(async (tx) => {
      for (const item of sale.items) {
        await cancelSaleReservation(tx, {
          companyId: companyId!,
          productId: item.productId,
          quantity: item.quantity,
          userId: session.user.id,
          referenceId: sale.id,
        });
      }

      await tx.saleOrder.update({
        where: { id: sale.id },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
    });

    revalidatePath("/dashboard/sales");
    revalidatePath("/dashboard/products");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Error al cancelar venta" };
  }
}
