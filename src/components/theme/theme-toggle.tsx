"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "@/components/theme/theme-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const options: Array<{ value: Theme; label: string; icon: React.ComponentType<{ className?: string }> }> =
  [
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Oscuro", icon: Moon },
    { value: "system", label: "Sistema", icon: Monitor },
  ];

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();

  if (compact) {
    const nextTheme: Theme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
    const label =
      theme === "dark" ? "Modo oscuro" : theme === "light" ? "Modo claro" : "Tema del sistema";

    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setTheme(nextTheme)}
        aria-label={label}
        title={label}
        className="h-10 w-10 p-0"
      >
        <Icon className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="inline-flex rounded-lg border border-slate-200 p-1 dark:border-slate-700">
      {options.map((option) => {
        const Icon = option.icon;
        const active = theme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
            )}
          >
            <Icon className="h-4 w-4" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
