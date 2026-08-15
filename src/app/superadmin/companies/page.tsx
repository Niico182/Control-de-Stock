import {
  createCompanyAction,
  toggleCompanyActiveAction,
} from "@/lib/actions/company-actions";
import { CreateCompanyForm } from "@/components/superadmin/create-company-form";
import { CompanyAdminTable } from "@/components/superadmin/company-admin-table";
import { Card, CardHeader } from "@/components/ui/card";
import { prisma } from "@/lib/db";

export default async function SuperadminCompaniesPage() {
  const companies = await prisma.company.findMany({
    include: {
      members: {
        include: { user: true },
        where: { user: { role: "ADMIN" } },
      },
      _count: {
        select: {
          products: true,
          saleOrders: true,
          rentalOrders: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Empresas</h2>
        <p className="text-slate-600">Creá cuentas admin y gestioná tenants.</p>
      </div>

      <Card>
        <CardHeader title="Nueva empresa + admin" />
        <CreateCompanyForm action={createCompanyAction} />
      </Card>

      <Card>
        <CardHeader title="Listado de empresas" />
        <CompanyAdminTable
          companies={companies.map((company) => ({
            id: company.id,
            name: company.name,
            slug: company.slug,
            isActive: company.isActive,
            enableSales: company.enableSales,
            enableRentals: company.enableRentals,
            adminName: company.members[0]?.user.name ?? "—",
            adminEmail: company.members[0]?.user.email ?? "—",
            products: company._count.products,
            orders: company._count.saleOrders + company._count.rentalOrders,
          }))}
          onToggle={toggleCompanyActiveAction}
        />
      </Card>
    </div>
  );
}
