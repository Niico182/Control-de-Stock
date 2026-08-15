import { prisma } from "@/lib/db";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { es } from "date-fns/locale";

export async function getMonthlyEarnings(companyId: string, months = 6) {
  const results: Array<{ month: string; sales: number; rentals: number; total: number }> = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    const from = startOfMonth(date);
    const to = endOfMonth(date);

    const [sales, rentals] = await Promise.all([
      prisma.saleOrder.aggregate({
        where: {
          companyId,
          status: "COMPLETED",
          completedAt: { gte: from, lte: to },
        },
        _sum: { totalPrice: true },
      }),
      prisma.rentalOrder.aggregate({
        where: {
          companyId,
          status: { in: ["ACTIVE", "RETURNED"] },
          rentalDate: { gte: from, lte: to },
        },
        _sum: { totalPrice: true },
      }),
    ]);

    const salesTotal = Number(sales._sum.totalPrice ?? 0);
    const rentalsTotal = Number(rentals._sum.totalPrice ?? 0);

    results.push({
      month: format(date, "MMM yyyy", { locale: es }),
      sales: salesTotal,
      rentals: rentalsTotal,
      total: salesTotal + rentalsTotal,
    });
  }

  return results;
}

export async function getDashboardStats(companyId: string) {
  const [products, lowStock, activeRentals, presales, completedSales] = await Promise.all([
    prisma.product.count({ where: { companyId } }),
    prisma.product.findMany({ where: { companyId } }),
    prisma.rentalOrder.count({ where: { companyId, status: "ACTIVE" } }),
    prisma.saleOrder.count({ where: { companyId, status: "PRESALE" } }),
    prisma.saleOrder.count({ where: { companyId, status: "COMPLETED" } }),
  ]);

  const lowStockCount = lowStock.filter(
    (p) => p.quantityTotal - p.quantityReserved - p.quantityRented <= 3,
  ).length;

  return {
    products,
    lowStockCount,
    activeRentals,
    presales,
    completedSales,
  };
}

export async function getSuperadminStats() {
  const [companies, activeCompanies, users, orders] = await Promise.all([
    prisma.company.count(),
    prisma.company.count({ where: { isActive: true } }),
    prisma.user.count(),
    prisma.saleOrder.count(),
  ]);

  const rentals = await prisma.rentalOrder.count();

  return {
    companies,
    activeCompanies,
    users,
    orders: orders + rentals,
  };
}
