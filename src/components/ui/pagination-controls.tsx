import Link from "next/link";
import {
  buildPageHref,
  paginationRange,
  type PaginationMeta,
} from "@/lib/pagination";
import { cn } from "@/lib/utils";

type PaginationControlsProps = {
  meta: PaginationMeta;
  basePath: string;
  preservedParams?: Record<string, string | undefined>;
  pageParam?: string;
};

function NavButton({
  href,
  disabled,
  children,
}: {
  href?: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const className = cn(
    "inline-flex h-8 items-center rounded-lg border px-3 text-sm font-medium transition-colors",
    disabled
      ? "cursor-not-allowed border-slate-200 text-slate-300"
      : "border-slate-300 text-slate-700 hover:bg-slate-50",
  );

  if (disabled || !href) {
    return (
      <span aria-disabled className={className}>
        {children}
      </span>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function PaginationControls({
  meta,
  basePath,
  preservedParams = {},
  pageParam = "page",
}: PaginationControlsProps) {
  if (meta.total === 0) {
    return null;
  }

  const { from, to } = paginationRange(meta);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
      <p className="text-sm text-slate-500">
        Mostrando {from}–{to} de {meta.total}
      </p>

      {meta.totalPages > 1 ? (
        <div className="flex items-center gap-2">
          <NavButton
            disabled={!meta.hasPrev}
            href={
              meta.hasPrev
                ? buildPageHref(basePath, meta.page - 1, preservedParams, pageParam)
                : undefined
            }
          >
            Anterior
          </NavButton>
          <span className="px-1 text-sm text-slate-600">
            Página {meta.page} de {meta.totalPages}
          </span>
          <NavButton
            disabled={!meta.hasNext}
            href={
              meta.hasNext
                ? buildPageHref(basePath, meta.page + 1, preservedParams, pageParam)
                : undefined
            }
          >
            Siguiente
          </NavButton>
        </div>
      ) : null}
    </div>
  );
}
