import Link from "next/link";
import { ArrowRight, BarChart3, Boxes, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Control de Stock</p>
            <p className="text-xs text-slate-500">SaaS multi-empresa</p>
          </div>
          <Link href="/login">
            <Button>Iniciar sesión</Button>
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Controlá inventario, ventas y alquileres en un solo lugar
            </h1>
            <p className="mt-6 text-lg text-slate-600">
              Plataforma pensada para negocios que necesitan delegar accesos, reservar stock,
              registrar pedidos, exportar PDFs y medir ganancias mensuales.
            </p>
            <div className="mt-8 flex gap-3">
              <Link href="/login">
                <Button size="lg">
                  Probar ahora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white py-16">
          <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-3">
            <Feature
              icon={Boxes}
              title="Stock inteligente"
              description="Reservas para preventas, alquileres activos y devoluciones con faltantes."
            />
            <Feature
              icon={BarChart3}
              title="Reportes mensuales"
              description="Visualizá ganancias por ventas y alquileres mes a mes."
            />
            <Feature
              icon={ShieldCheck}
              title="Multi-empresa seguro"
              description="Superusuario, admins y empleados con permisos delegables."
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-6">
      <Icon className="h-8 w-8 text-slate-900" />
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  );
}
