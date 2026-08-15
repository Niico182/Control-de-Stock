import { inviteEmployeeAction } from "@/lib/actions/company-actions";
import { InviteForm } from "@/components/team/invite-form";
import { Card, CardHeader } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { getCompanyContext } from "@/lib/tenant";
import { redirect } from "next/navigation";

export default async function TeamPage() {
  const { companyId, permissions } = await getCompanyContext();

  if (!permissions.canManageMembers && permissions.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [members, invitations] = await Promise.all([
    prisma.companyMember.findMany({
      where: { companyId: companyId! },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.invitation.findMany({
      where: { companyId: companyId!, usedAt: null },
      orderBy: { createdAt: "desc" },
    }),
  ]);

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
        <CardHeader title="Miembros" />
        <ul className="space-y-2 text-sm">
          {members.map((member) => (
            <li key={member.id} className="rounded-lg border border-slate-200 p-3">
              <p className="font-medium">{member.user.name}</p>
              <p className="text-slate-500">{member.user.email}</p>
              <p className="text-xs text-slate-400">Rol: {member.user.role}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader title="Invitaciones pendientes" />
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
      </Card>
    </div>
  );
}
