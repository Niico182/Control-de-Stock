import { getSuperadminStats } from "@/lib/reports";
import { Card, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SuperadminPage() {
  const stats = await getSuperadminStats();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Panel global</h2>
        <p className="text-slate-600">Métricas generales de la plataforma.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Empresas" value={String(stats.companies)} />
        <StatCard title="Empresas activas" value={String(stats.activeCompanies)} />
        <StatCard title="Usuarios" value={String(stats.users)} />
        <StatCard title="Operaciones" value={String(stats.orders)} />
      </div>

      <Card>
        <CardHeader
          title="Gestión de empresas"
          description="Creá admins y empresas para nuevos clientes."
        />
        <Link href="/superadmin/companies">
          <Button>Ir a empresas</Button>
        </Link>
      </Card>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </Card>
  );
}
