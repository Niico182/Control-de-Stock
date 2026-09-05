"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertPermission } from "@/lib/permissions";
import {
  cancelRental,
  rentOutProducts,
  returnRentalProducts,
} from "@/lib/stock";
import { getCompanyContext } from "@/lib/tenant";
import { parseArgDate } from "@/lib/dates";
import { revalidateProductPaths } from "@/lib/products/revalidate-paths";
import { rentalOrderSchema, rentalReturnSchema } from "@/lib/validators";

export async function createRentalAction(formData: FormData) {
  try {
    const { companyId, session, permissions, company } = await getCompanyContext();
    assertPermission(permissions, "canCreateOrders");

    if (!company.enableRentals) {
      return { error: "El módulo de alquileres no está activo" };
    }

    const itemsRaw = formData.get("items");
    const items = itemsRaw ? JSON.parse(String(itemsRaw)) : [];

    const parsed = rentalOrderSchema.safeParse({
      clientName: formData.get("clientName"),
      address: formData.get("address"),
      rentalDate: formData.get("rentalDate"),
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
      const rental = await tx.rentalOrder.create({
        data: {
          companyId: companyId!,
          clientName: parsed.data.clientName,
          address: parsed.data.address,
          rentalDate: parseArgDate(parsed.data.rentalDate)!,
          notes: parsed.data.notes,
          totalPrice,
          status: "ACTIVE",
          items: {
            create: parsed.data.items.map((item) => ({
              productVariantId: item.productVariantId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
        include: { items: true },
      });

      for (const item of rental.items) {
        await rentOutProducts(tx, {
          companyId: companyId!,
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          userId: session.user.id,
          referenceId: rental.id,
        });
      }
    });

    revalidatePath("/dashboard/rentals");
    revalidateProductPaths();
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Error al crear alquiler" };
  }
}

export async function returnRentalAction(formData: FormData) {
  try {
    const { companyId, session, permissions } = await getCompanyContext();
    assertPermission(permissions, "canCreateOrders");

    const itemsRaw = formData.get("items");
    const items = itemsRaw ? JSON.parse(String(itemsRaw)) : [];

    const parsed = rentalReturnSchema.safeParse({
      rentalOrderId: formData.get("rentalOrderId"),
      notes: formData.get("notes") || undefined,
      items,
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const rental = await prisma.rentalOrder.findFirst({
      where: {
        id: parsed.data.rentalOrderId,
        companyId: companyId!,
        status: "ACTIVE",
      },
      include: { items: true },
    });

    if (!rental) {
      return { error: "Pedido de alquiler no encontrado" };
    }

    await prisma.$transaction(async (tx) => {
      const rentalReturn = await tx.rentalReturn.create({
        data: {
          rentalOrderId: rental.id,
          notes: parsed.data.notes,
          items: {
            create: parsed.data.items.map((item) => ({
              productVariantId: item.productVariantId,
              quantityReturned: item.quantityReturned,
              quantityMissing: item.quantityMissing,
            })),
          },
        },
      });

      for (const item of parsed.data.items) {
        await returnRentalProducts(tx, {
          companyId: companyId!,
          productVariantId: item.productVariantId,
          quantityReturned: item.quantityReturned,
          quantityMissing: item.quantityMissing,
          userId: session.user.id,
          referenceId: rental.id,
        });
      }

      await tx.rentalOrder.update({
        where: { id: rental.id },
        data: { status: "RETURNED", returnedAt: new Date() },
      });

      void rentalReturn;
    });

    revalidatePath("/dashboard/rentals");
    revalidatePath("/dashboard/reports");
    revalidateProductPaths();
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Error al registrar devolución" };
  }
}

export async function cancelRentalAction(rentalId: string) {
  try {
    const { companyId, session, permissions } = await getCompanyContext();
    assertPermission(permissions, "canCreateOrders");

    const rental = await prisma.rentalOrder.findFirst({
      where: { id: rentalId, companyId: companyId!, status: "ACTIVE" },
      include: { items: true },
    });

    if (!rental) {
      return { error: "Pedido no encontrado" };
    }

    await prisma.$transaction(async (tx) => {
      for (const item of rental.items) {
        await cancelRental(tx, {
          companyId: companyId!,
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          userId: session.user.id,
          referenceId: rental.id,
        });
      }

      await tx.rentalOrder.update({
        where: { id: rental.id },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
    });

    revalidatePath("/dashboard/rentals");
    revalidateProductPaths();
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Error al cancelar alquiler" };
  }
}
