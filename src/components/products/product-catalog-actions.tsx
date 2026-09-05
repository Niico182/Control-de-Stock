import Link from "next/link";
import type { ProductCatalogType } from "@/lib/products/catalog";
import { PRODUCT_CATALOGS } from "@/lib/products/catalog";
import { Button } from "@/components/ui/button";

export function ProductCatalogActions({
  catalog,
  canManage,
}: {
  catalog: ProductCatalogType;
  canManage: boolean;
}) {
  if (!canManage) {
    return null;
  }

  const config = PRODUCT_CATALOGS[catalog];
  const importHref = `${config.newHref}#import`;

  return (
    <div className="flex flex-wrap gap-2">
      <Link href={config.newHref}>
        <Button>+ Nuevo producto</Button>
      </Link>
      <Link href={importHref}>
        <Button variant="outline">Importar CSV</Button>
      </Link>
    </div>
  );
}

export function ProductCatalogEmptyState({
  catalog,
  canManage,
}: {
  catalog: ProductCatalogType;
  canManage: boolean;
}) {
  const config = PRODUCT_CATALOGS[catalog];
  const isRental = catalog === "RENTAL";

  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900/40">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {isRental
          ? "Todavía no hay productos de alquiler"
          : "Todavía no hay productos de venta"}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
        {isRental
          ? "Cargá sillas, mesas, equipos u otros ítems que alquilás. Podés agregar uno manualmente o importar muchos desde un CSV."
          : "Cargá los productos que vendés. Podés agregar uno manualmente o importar muchos desde un CSV."}
      </p>

      {canManage ? (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={config.newHref}>
            <Button>+ Agregar producto</Button>
          </Link>
          <Link href={`${config.newHref}#import`}>
            <Button variant="outline">Importar desde CSV</Button>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
