import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { RentalOrderPdfDocument } from "@/lib/pdf/rental-order";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;

  const rental = await prisma.rentalOrder.findUnique({
    where: { id },
    include: {
      company: true,
      items: { include: { product: true } },
    },
  });

  if (!rental) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  if (session.user.role !== "SUPERUSER") {
    const membership = await prisma.companyMember.findFirst({
      where: {
        userId: session.user.id,
        companyId: rental.companyId,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
  }

  const buffer = await renderToBuffer(
    RentalOrderPdfDocument({
      companyName: rental.company.name,
      order: {
        id: rental.id,
        clientName: rental.clientName,
        address: rental.address,
        rentalDate: rental.rentalDate,
        totalPrice: Number(rental.totalPrice),
        items: rental.items.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
        })),
      },
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="alquiler-${rental.id}.pdf"`,
    },
  });
}
