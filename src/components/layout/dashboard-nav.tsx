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
  PanelLeftClose,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function DashboardNav({
  role,
  enableSales,
  enableRentals,
  isOpen = true,
  onHide,
}: {
  role: string;
  enableSales: boolean;
  enableRentals: boolean;
  isOpen?: boolean;
  onHide?: () => void;
}) {
  const pathname = usePathname();

  const companyNav: NavItem[] = [
    { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  ];

  if (enableSales) {
    companyNav.push({
      href: "/dashboard/products/sale",
      label: enableRentals ? "Productos venta" : "Productos",
      icon: Boxes,
    });
  }

  if (enableRentals) {
    companyNav.push({
      href: "/dashboard/products/rental",
      label: enableSales ? "Productos alquiler" : "Productos",
      icon: Boxes,
    });
  }

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
    <aside
      className={cn(
        "flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900",
        isOpen ? "translate-x-0" : "-translate-x-full fixed inset-y-0 left-0 z-40",
        !isOpen && "pointer-events-none",
      )}
      aria-hidden={!isOpen}
    >
      <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Control de Stock</p>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {role === "SUPERUSER" ? "Superadmin" : "Panel empresa"}
            </h1>
          </div>
          {onHide ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onHide}
              className="h-8 w-8 shrink-0 p-0"
              aria-label="Ocultar menú"
              title="Ocultar menú"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href === "/dashboard/products/sale" &&
              pathname.startsWith("/dashboard/products/sale")) ||
            (item.href === "/dashboard/products/rental" &&
              pathname.startsWith("/dashboard/products/rental")) ||
            (item.href === "/dashboard/products" && pathname === "/dashboard/products");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
