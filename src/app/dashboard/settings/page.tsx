import { updateCompanySettingsAction } from "@/lib/actions/company-actions";
import { CompanySettingsForm } from "@/components/settings/company-settings-form";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Card, CardHeader } from "@/components/ui/card";
import { getCompanyContext } from "@/lib/tenant";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const { company, permissions } = await getCompanyContext();

  if (!permissions.canManageMembers && permissions.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuración</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Módulos activos y datos de la empresa.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Apariencia"
          description="Elegí cómo se ve la interfaz en este dispositivo."
        />
        <ThemeToggle />
      </Card>

      <Card>
        <CardHeader title="Empresa" />
        <CompanySettingsForm
          company={{
            name: company.name,
            enableSales: company.enableSales,
            enableRentals: company.enableRentals,
          }}
          action={updateCompanySettingsAction}
        />
      </Card>
    </div>
  );
}
