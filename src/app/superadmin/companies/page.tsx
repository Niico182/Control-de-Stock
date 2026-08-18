import {
  createCompanyAction,
  toggleCompanyActiveAction,
} from "@/lib/actions/company-actions";
import { CreateCompanyForm } from "@/components/superadmin/create-company-form";
import { CompanyAdminTable } from "@/components/superadmin/company-admin-table";
import { Card, CardHeader } from "@/components/ui/card";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { prisma } from "@/lib/db";
import { paginationMeta, parsePaginationParams } from "@/lib/pagination";
import {
  COMPANY_SORT_COLUMNS,
  companyOrderBy,
  parseSortParams,
  pickPreservedParams,
} from "@/lib/sorting";

export default async function SuperadminCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string; sort?: string; dir?: string }>;
}) {
  const params = await searchParams;
  const { page, pageSize, skip, take } = parsePaginationParams(params);
  const { sort, dir } = parseSortParams(params, COMPANY_SORT_COLUMNS, "name");
  const preservedParams = pickPreservedParams(params, ["sort", "dir"]);

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
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
      orderBy: companyOrderBy(sort, dir),
      skip,
      take,
    }),
    prisma.company.count(),
  ]);

  const meta = paginationMeta(total, page, pageSize);

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
        <CardHeader
          title="Listado de empresas"
          description={`${total} empresa${total === 1 ? "" : "s"} registrada${total === 1 ? "" : "s"}`}
        />
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
          sort={sort}
          dir={dir}
          basePath="/superadmin/companies"
          preservedParams={preservedParams}
        />
        <PaginationControls
          meta={meta}
          basePath="/superadmin/companies"
          preservedParams={preservedParams}
        />
      </Card>
    </div>
  );
}
