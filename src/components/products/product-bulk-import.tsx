"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importProductsBulkAction } from "@/lib/actions/product-import-actions";
import {
  downloadSampleCsv,
  parseAndValidateProductCsv,
  type BulkProductRow,
  type ProductImportRowResult,
} from "@/lib/products/csv-import";
import type { ProductCatalogType } from "@/lib/products/catalog";
import { PRODUCT_CATALOGS } from "@/lib/products/catalog";
import type { ProductCategoryOption } from "@/lib/products/categories";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ClientSortableTable } from "@/components/ui/client-sortable-table";

type ValidImportRow = BulkProductRow & { rowNumber: number };

export function ProductBulkImport({
  productType,
  categories,
}: {
  productType: ProductCatalogType;
  categories: ProductCategoryOption[];
}) {
  const router = useRouter();
  const catalogLabel = PRODUCT_CATALOGS[productType].singular;
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [results, setResults] = useState<ProductImportRowResult[]>([]);
  const [canImport, setCanImport] = useState(false);
  const [validRows, setValidRows] = useState<ValidImportRow[]>([]);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetPreview() {
    setResults([]);
    setCanImport(false);
    setValidRows([]);
    setError(null);
  }

  function clearFileInput() {
    setFileName(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleImportSuccess(count: number) {
    resetPreview();
    clearFileInput();
    setImportedCount(count);
  }

  function handleSuccessDialogClose() {
    setImportedCount(null);
    router.refresh();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    resetPreview();

    if (!file) {
      setFileName(null);
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const parsed = parseAndValidateProductCsv(text, productType, categories);
      setResults(parsed.results);
      setCanImport(parsed.canImport);
      setValidRows(parsed.validRows);

      if (parsed.validRows.length === 0 && parsed.invalidRows.length === 0) {
        setError("El archivo no contiene productos para importar.");
      }
    };
    reader.readAsText(file, "UTF-8");
  }

  return (
    <Card>
      <CardHeader
        title="Carga masiva CSV"
        description={`Importá muchos productos de ${catalogLabel} de una vez. Descargá el ejemplo, completalo y subilo.`}
      />

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={() => downloadSampleCsv(productType)}>
          Descargar CSV de ejemplo
        </Button>
        <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
          Seleccionar CSV
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {fileName ? <p className="mt-3 text-sm text-slate-600">Archivo: {fileName}</p> : null}

      {results.length > 0 ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-lg bg-slate-50 p-4 text-sm">
            <p>
              Productos válidos:{" "}
              <span className="font-semibold">{validRows.length}</span>
            </p>
            <p>
              Filas con error:{" "}
              <span className="font-semibold">
                {results.filter((row) => row.errors.length > 0).length}
              </span>
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <ClientSortableTable
              columns={[
                { key: "rowNumber", label: "Fila", getValue: (row) => row.rowNumber },
                { key: "name", label: "Nombre", getValue: (row) => row.name },
                { key: "stock", label: "Stock", getValue: (row) => row.stock },
                { key: "price", label: "Precio", getValue: (row) => row.price },
                { key: "color", label: "Color", getValue: (row) => row.color },
                { key: "code", label: "SKU", getValue: (row) => row.code },
                { key: "category", label: "Categoría", getValue: (row) => row.category },
                { key: "status", label: "Estado", getValue: (row) => row.status },
              ]}
              rows={results.map((row) => ({
                id: String(row.rowNumber),
                rowNumber: row.rowNumber,
                name: row.raw.name ?? "—",
                stock: Number(row.raw.quantity ?? 0),
                stockDisplay: row.raw.quantity ?? "—",
                price: Number(row.raw.price ?? 0),
                priceDisplay: row.raw.price ?? "—",
                code: row.raw.sku || "Auto",
                color: row.raw.color || "—",
                category: row.raw.categoryName || "—",
                estado: row.raw.isActive || "Activo",
                status: row.errors.length === 0 ? "OK" : row.errors.join(" "),
                hasError: row.errors.length > 0,
              }))}
              defaultSort="rowNumber"
              renderRow={(row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{row.rowNumber}</td>
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="px-3 py-2">{row.stockDisplay}</td>
                  <td className="px-3 py-2">{row.priceDisplay}</td>
                  <td className="px-3 py-2">{row.color}</td>
                  <td className="px-3 py-2">{row.code}</td>
                  <td className="px-3 py-2">{row.category}</td>
                  <td className="px-3 py-2">
                    {row.hasError ? (
                      <span className="text-red-600">{row.status}</span>
                    ) : (
                      <span className="text-emerald-700">{row.status}</span>
                    )}
                  </td>
                </tr>
              )}
            />
          </div>

          {canImport ? (
            <Button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const result = await importProductsBulkAction(validRows);
                  if (result.error) {
                    setError(result.error);
                    return;
                  }

                  handleImportSuccess(result.imported ?? validRows.length);
                })
              }
            >
              {isPending ? "Importando..." : `Importar ${validRows.length} productos`}
            </Button>
          ) : (
            <p className="text-sm text-red-600">
              Corregí las filas con error antes de importar.
            </p>
          )}
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <AlertDialog
        open={importedCount !== null}
        title="Importación exitosa"
        description={
          importedCount === 1
            ? "Se importó 1 variación correctamente desde el CSV."
            : `Se importaron ${importedCount} variaciones correctamente desde el CSV.`
        }
        onClose={handleSuccessDialogClose}
      />

      <p className="mt-4 text-xs text-slate-500">
        Columnas obligatorias: nombre, stock, precio. Opcionales: color, codigo, categoria,
        descripcion, costo, estado (Activo/Inactivo). Filas con el mismo nombre crean variaciones
        del mismo producto. La categoría debe existir previamente en este catálogo.
      </p>
    </Card>
  );
}
