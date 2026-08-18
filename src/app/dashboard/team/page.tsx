import { inviteEmployeeAction } from "@/lib/actions/company-actions";
import { InviteForm } from "@/components/team/invite-form";
import { Card, CardHeader } from "@/components/ui/card";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { prisma } from "@/lib/db";
import { paginationMeta, parsePaginationParams } from "@/lib/pagination";
import { getCompanyContext } from "@/lib/tenant";
import { redirect } from "next/navigation";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; invitePage?: string; pageSize?: string }>;
}) {
  const { companyId, permissions } = await getCompanyContext();

  if (!permissions.canManageMembers && permissions.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const membersPagination = parsePaginationParams({
    page: params.page,
    pageSize: params.pageSize,
  });
  const invitesPagination = parsePaginationParams({
    page: params.invitePage,
    pageSize: params.pageSize,
  });

  const membersWhere = { companyId: companyId! };
  const invitationsWhere = { companyId: companyId!, usedAt: null };

  const [members, membersTotal, invitations, invitationsTotal] = await Promise.all([
    prisma.companyMember.findMany({
      where: membersWhere,
      include: { user: true },
      orderBy: { createdAt: "asc" },
      skip: membersPagination.skip,
      take: membersPagination.take,
    }),
    prisma.companyMember.count({ where: membersWhere }),
    prisma.invitation.findMany({
      where: invitationsWhere,
      orderBy: { createdAt: "desc" },
      skip: invitesPagination.skip,
      take: invitesPagination.take,
    }),
    prisma.invitation.count({ where: invitationsWhere }),
  ]);

  const membersMeta = paginationMeta(
    membersTotal,
    membersPagination.page,
    membersPagination.pageSize,
  );
  const invitesMeta = paginationMeta(
    invitationsTotal,
    invitesPagination.page,
    invitesPagination.pageSize,
  );

  const invitePagePreserved =
    invitesPagination.page > 1 ? { invitePage: String(invitesPagination.page) } : {};
  const membersPagePreserved =
    membersPagination.page > 1 ? { page: String(membersPagination.page) } : {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Equipo</h2>
        <p className="text-slate-600">Invitá empleados y delegá permisos.</p>
      </div>

      <Card>
        <CardHeader title="Invitar empleado" />
        <InviteForm action={inviteEmployeeAction} />
      </Card>

      <Card>
        <CardHeader
          title="Miembros"
          description={`${membersTotal} miembro${membersTotal === 1 ? "" : "s"}`}
        />
        {members.length === 0 ? (
          <p className="text-sm text-slate-500">No hay miembros registrados.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {members.map((member) => (
              <li key={member.id} className="rounded-lg border border-slate-200 p-3">
                <p className="font-medium">{member.user.name}</p>
                <p className="text-slate-500">{member.user.email}</p>
                <p className="text-xs text-slate-400">Rol: {member.user.role}</p>
              </li>
            ))}
          </ul>
        )}
        <PaginationControls
          meta={membersMeta}
          basePath="/dashboard/team"
          preservedParams={invitePagePreserved}
        />
      </Card>

      <Card>
        <CardHeader
          title="Invitaciones pendientes"
          description={`${invitationsTotal} invitación${invitationsTotal === 1 ? "" : "es"} pendiente${invitationsTotal === 1 ? "" : "s"}`}
        />
        {invitations.length === 0 ? (
          <p className="text-sm text-slate-500">No hay invitaciones pendientes.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {invitations.map((invitation) => (
              <li key={invitation.id} className="rounded-lg bg-slate-50 p-3">
                <p>{invitation.email}</p>
                <p className="text-xs text-slate-500">
                  Expira: {invitation.expiresAt.toLocaleDateString("es-AR")}
                </p>
                <p className="mt-1 break-all text-xs text-blue-600">
                  {`${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitation.token}`}
                </p>
              </li>
            ))}
          </ul>
        )}
        <PaginationControls
          meta={invitesMeta}
          basePath="/dashboard/team"
          pageParam="invitePage"
          preservedParams={membersPagePreserved}
        />
      </Card>
    </div>
  );
}
