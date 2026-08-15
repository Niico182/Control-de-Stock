"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  Building2,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function DashboardNav({
  role,
  enableSales,
  enableRentals,
}: {
  role: string;
  enableSales: boolean;
  enableRentals: boolean;
}) {
  const pathname = usePathname();

  const companyNav: NavItem[] = [
    { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
    { href: "/dashboard/products", label: "Productos", icon: Boxes },
  ];

  if (enableSales) {
    companyNav.push({ href: "/dashboard/sales", label: "Ventas", icon: ShoppingCart });
  }

  if (enableRentals) {
    companyNav.push({ href: "/dashboard/rentals", label: "Alquileres", icon: HandCoins });
  }

  companyNav.push(
    { href: "/dashboard/reports", label: "Reportes", icon: BarChart3 },
    { href: "/dashboard/settings", label: "Configuración", icon: Settings },
    { href: "/dashboard/team", label: "Equipo", icon: Users },
  );

  const superNav: NavItem[] = [
    { href: "/superadmin", label: "Panel global", icon: Building2 },
    { href: "/superadmin/companies", label: "Empresas", icon: Boxes },
  ];

  const items = role === "SUPERUSER" ? superNav : companyNav;

  return (
    <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <p className="text-xs uppercase tracking-wide text-slate-500">Control de Stock</p>
        <h1 className="text-lg font-semibold text-slate-900">
          {role === "SUPERUSER" ? "Superadmin" : "Panel empresa"}
        </h1>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
