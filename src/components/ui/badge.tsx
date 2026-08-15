import { cn } from "@/lib/utils";

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const styles = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[variant],
      )}
    >
      {children}
    </span>
  );
}

export function saleStatusBadge(status: string) {
  switch (status) {
    case "PRESALE":
      return <Badge variant="warning">Preventa</Badge>;
    case "COMPLETED":
      return <Badge variant="success">Completada</Badge>;
    case "CANCELLED":
      return <Badge variant="danger">Cancelada</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export function rentalStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return <Badge variant="info">Activo</Badge>;
    case "RETURNED":
      return <Badge variant="success">Devuelto</Badge>;
    case "CANCELLED":
      return <Badge variant="danger">Cancelado</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}
