import { z } from "zod";
import type { ProductCatalogType } from "@/lib/products/catalog";

export const bulkProductRowSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  price: z.coerce.number().positive("El precio debe ser mayor a 0"),
  quantity: z.coerce.number().int().min(0, "La cantidad no puede ser negativa"),
  type: z.enum(["SALE", "RENTAL"], {
    message: "El tipo debe ser SALE o RENTAL",
  }),
  code: z.string().optional(),
});

export type BulkProductRow = z.infer<typeof bulkProductRowSchema>;

export type ParsedProductRow = BulkProductRow & {
  rowNumber: number;
};

export type ProductImportRowResult = {
  rowNumber: number;
  raw: Record<string, string>;
  data?: BulkProductRow;
  errors: string[];
};

const HEADER_MAP: Record<string, keyof BulkProductRow | "ignore"> = {
  nombre: "name",
  name: "name",
  precio: "price",
  price: "price",
  cantidad: "quantity",
  quantity: "quantity",
  stock: "quantity",
  tipo: "type",
  type: "type",
  codigo: "code",
  code: "code",
};

const TYPE_MAP: Record<string, BulkProductRow["type"]> = {
  SALE: "SALE",
  VENTA: "SALE",
  RENTAL: "RENTAL",
  ALQUILER: "RENTAL",
};

export const CSV_SAMPLE_SALE = `nombre,precio,cantidad,codigo
Mantel blanco,800,50,
Vaso plástico,120,200,
Plato descartable,90,150,PRD-PLT-001`;

export const CSV_SAMPLE_RENTAL = `nombre,precio,cantidad,codigo
Silla plegable,1500,20,
Mesa recta,3500,10,
Equipo de sonido,12000,5,PRD-SON-001`;

export function getSampleCsvContent(catalog: ProductCatalogType) {
  return catalog === "SALE" ? CSV_SAMPLE_SALE : CSV_SAMPLE_RENTAL;
}

export function downloadSampleCsv(catalog: ProductCatalogType) {
  const content = getSampleCsvContent(catalog);
  const blob = new Blob([`\uFEFF${content}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = catalog === "SALE" ? "productos-venta-ejemplo.csv" : "productos-alquiler-ejemplo.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export const MAX_BULK_IMPORT_ROWS = 500;

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/^\uFEFF/, "");
}

function normalizeProductType(value: string) {
  return TYPE_MAP[value.trim().toUpperCase()] ?? null;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

export function parseCsv(text: string): string[][] {
  return text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(parseCsvLine);
}

export function mapRow(headers: string[], cells: string[]) {
  const mapped: Record<string, string> = {};

  headers.forEach((header, index) => {
    const key = HEADER_MAP[normalizeHeader(header)];
    if (!key || key === "ignore") return;
    mapped[key] = cells[index]?.trim() ?? "";
  });

  return mapped;
}

export function validateProductImportRows(
  rows: string[][],
  catalogType: ProductCatalogType,
): ProductImportRowResult[] {
  if (rows.length === 0) {
    return [
      {
        rowNumber: 0,
        raw: {},
        errors: ["El archivo CSV está vacío."],
      },
    ];
  }

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map(normalizeHeader);
  const hasName = headers.some((header) => HEADER_MAP[header] === "name");
  const hasPrice = headers.some((header) => HEADER_MAP[header] === "price");

  if (!hasName || !hasPrice) {
    return [
      {
        rowNumber: 1,
        raw: {},
        errors: ["El CSV debe incluir al menos las columnas nombre y precio."],
      },
    ];
  }

  if (dataRows.length > MAX_BULK_IMPORT_ROWS) {
    return [
      {
        rowNumber: 0,
        raw: {},
        errors: [`Máximo ${MAX_BULK_IMPORT_ROWS} productos por importación.`],
      },
    ];
  }

  const results: ProductImportRowResult[] = [];
  const codesInFile = new Map<string, number>();

  dataRows.forEach((cells, index) => {
    const rowNumber = index + 2;
    const raw = mapRow(headerRow, cells);
    const errors: string[] = [];

    const normalizedType = raw.type ? normalizeProductType(raw.type) : catalogType;

    if (!raw.name) errors.push("Falta el nombre.");
    if (!raw.price) errors.push("Falta el precio.");
    if (!raw.quantity) raw.quantity = "0";
    if (raw.type && !normalizeProductType(raw.type)) {
      errors.push("Tipo inválido. Usá SALE o RENTAL.");
    } else if (raw.type && normalizedType !== catalogType) {
      errors.push(`El tipo debe ser ${catalogType} para este catálogo.`);
    }

    if (raw.code) {
      const normalizedCode = raw.code.toUpperCase();
      const previousRow = codesInFile.get(normalizedCode);
      if (previousRow) {
        errors.push(`Código duplicado en el archivo (fila ${previousRow}).`);
      } else {
        codesInFile.set(normalizedCode, rowNumber);
      }
    }

    const parsed = bulkProductRowSchema.safeParse({
      name: raw.name,
      price: raw.price,
      quantity: raw.quantity,
      type: normalizedType,
      code: raw.code || undefined,
    });

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => errors.push(issue.message));
    }

    results.push({
      rowNumber,
      raw,
      data: parsed.success ? parsed.data : undefined,
      errors,
    });
  });

  return results;
}

export function parseAndValidateProductCsv(text: string, catalogType: ProductCatalogType) {
  const rows = parseCsv(text);
  const results = validateProductImportRows(rows, catalogType);
  const validRows = results
    .filter((row) => row.data && row.errors.length === 0)
    .map((row) => ({ ...row.data!, rowNumber: row.rowNumber }));
  const invalidRows = results.filter((row) => row.errors.length > 0);

  return {
    results,
    validRows,
    invalidRows,
    canImport: invalidRows.length === 0 && validRows.length > 0,
  };
}
