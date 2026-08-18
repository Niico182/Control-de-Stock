"use client";

import { useEffect, useState } from "react";
import { Menu, PanelLeftClose } from "lucide-react";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SIDEBAR_KEY = "control-de-stock-sidebar-open";

type DashboardLayoutClientProps = {
  role: string;
  enableSales: boolean;
  enableRentals: boolean;
  sessionLabel: string;
  title: string;
  children: React.ReactNode;
};

export function DashboardLayoutClient({
  role,
  enableSales,
  enableRentals,
  sessionLabel,
  title,
  children,
}: DashboardLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    if (stored !== null) {
      setSidebarOpen(stored === "true");
    }
  }, []);

  function toggleSidebar(nextOpen: boolean) {
    setSidebarOpen(nextOpen);
    localStorage.setItem(SIDEBAR_KEY, String(nextOpen));
  }

  return (
    <div className="flex min-h-screen">
      <DashboardNav
        role={role}
        enableSales={enableSales}
        enableRentals={enableRentals}
        isOpen={sidebarOpen}
        onHide={() => toggleSidebar(false)}
      />

      <main className={cn("flex-1 overflow-auto transition-all", sidebarOpen ? "" : "w-full")}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-8">
          <div className="flex items-center gap-3">
            {!sidebarOpen ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => toggleSidebar(true)}
                aria-label="Mostrar menú"
              >
                <Menu className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Menú</span>
              </Button>
            ) : null}

            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{sessionLabel}</p>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
            </div>
          </div>

          <ThemeToggle compact />
        </div>

        <div className="p-4 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
