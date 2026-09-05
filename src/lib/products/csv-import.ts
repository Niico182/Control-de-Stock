import { z } from "zod";
import type { ProductCatalogType } from "@/lib/products/catalog";
import {
  findCategoryByName,
  type ProductCategoryOption,
} from "@/lib/products/categories";
import { parseProductActiveStatus } from "@/lib/products/fields";

export const bulkProductRowSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  basePrice: z.coerce.number().positive("El precio debe ser mayor a 0"),
  quantity: z.coerce.number().int().min(0, "El stock no puede ser negativo"),
  type: z.enum(["SALE", "RENTAL"], {
    message: "El tipo debe ser SALE o RENTAL",
  }),
  sku: z.string().optional(),
  color: z.string().optional(),
  variantPrice: z.coerce.number().positive("El precio de variación debe ser mayor a 0").optional(),
  categoryId: z.string().uuid().optional(),
  description: z.string().optional(),
  cost: z.coerce.number().min(0, "El costo no puede ser negativo").optional(),
  isActive: z.boolean().default(true),
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

const HEADER_MAP: Record<string, keyof BulkProductRow | "categoryName" | "price" | "ignore"> = {
  nombre: "name",
  name: "name",
  precio: "price",
  price: "price",
  precio_venta: "price",
  precio_alquiler: "price",
  cantidad: "quantity",
  quantity: "quantity",
  stock: "quantity",
  tipo: "type",
  type: "type",
  codigo: "sku",
  code: "sku",
  sku: "sku",
  color: "color",
  variacion: "color",
  variante: "color",
  categoria: "categoryName",
  category: "categoryName",
  descripcion: "description",
  description: "description",
  costo: "cost",
  cost: "cost",
  estado: "isActive",
  status: "isActive",
};

const TYPE_MAP: Record<string, BulkProductRow["type"]> = {
  SALE: "SALE",
  VENTA: "SALE",
  RENTAL: "RENTAL",
  ALQUILER: "RENTAL",
};

const CSV_HEADER =
  "nombre,color,codigo,categoria,descripcion,stock,precio,costo,estado";

export const CSV_SAMPLE_SALE = `# Obligatorios: nombre, stock, precio. Opcionales: color, codigo, categoria, descripcion, costo, estado.
# Filas con el mismo nombre se agrupan en un producto con varias variaciones (por color).
# La columna categoria debe coincidir con una categoría ya creada (no importa mayúsculas/acentos).
${CSV_HEADER}
Servilleta,Blanco,SERV-BLAN,Mantelería,Servilleta de tela,100,50,20,Activo
Servilleta,Rojo,SERV-ROJO,Mantelería,Servilleta de tela,80,50,20,Activo
Mantel redondo,Blanco,MTL-BLAN,Mantelería,Mantel 2x2 m,25,800,300,Activo`;

export const CSV_SAMPLE_RENTAL = `# Obligatorios: nombre, stock, precio. Opcionales: color, codigo, categoria, descripcion, costo, estado.
# Filas con el mismo nombre se agrupan en un producto con varias variaciones (por color).
# La columna categoria debe coincidir con una categoría ya creada (no importa mayúsculas/acentos).
${CSV_HEADER}
Servilleta,Blanco,SERV-BLAN,Mantelería,Servilleta de tela,100,50,20,Activo
Servilleta,Burdeos,SERV-BUR,Mantelería,Servilleta de tela,60,55,20,Activo
Silla plegable,,SILLA-01,Mobiliario,,20,1500,4500,Activo`;

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
    .filter((line) => line.length > 0 && !line.startsWith("#"))
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
  categories: ProductCategoryOption[] = [],
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
  const hasStock = headers.some(
    (header) => HEADER_MAP[header] === "quantity",
  );

  if (!hasName || !hasPrice || !hasStock) {
    return [
      {
        rowNumber: 1,
        raw: {},
        errors: ["El CSV debe incluir las columnas nombre, stock y precio."],
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
    if (raw.quantity === undefined || raw.quantity === "") {
      errors.push("Falta el stock.");
    }
    if (raw.type && !normalizeProductType(raw.type)) {
      errors.push("Tipo inválido. Usá SALE o RENTAL.");
    } else if (raw.type && normalizedType !== catalogType) {
      errors.push(`El tipo debe ser ${catalogType} para este catálogo.`);
    }

    let isActive = true;
    if (raw.isActive) {
      const parsedStatus = parseProductActiveStatus(raw.isActive);
      if (parsedStatus === null) {
        errors.push("Estado inválido. Usá Activo o Inactivo.");
      } else {
        isActive = parsedStatus;
      }
    }

    let cost: number | undefined;
    if (raw.cost) {
      const parsedCost = Number(raw.cost);
      if (Number.isNaN(parsedCost) || parsedCost < 0) {
        errors.push("Costo inválido.");
      } else {
        cost = parsedCost;
      }
    }

    if (raw.sku) {
      const normalizedCode = raw.sku.toUpperCase();
      const previousRow = codesInFile.get(normalizedCode);
      if (previousRow) {
        errors.push(`Código duplicado en el archivo (fila ${previousRow}).`);
      } else {
        codesInFile.set(normalizedCode, rowNumber);
      }
    }

    let categoryId: string | undefined;
    if (raw.categoryName) {
      const match = findCategoryByName(raw.categoryName, categories);
      if (!match) {
        errors.push(`Categoría "${raw.categoryName}" no existe. Creala antes de importar.`);
      } else {
        categoryId = match.id;
      }
    }

    const parsed = bulkProductRowSchema.safeParse({
      name: raw.name,
      basePrice: raw.price,
      quantity: raw.quantity,
      type: normalizedType,
      sku: raw.sku || undefined,
      color: raw.color || undefined,
      categoryId,
      description: raw.description || undefined,
      cost,
      isActive,
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

export function parseAndValidateProductCsv(
  text: string,
  catalogType: ProductCatalogType,
  categories: ProductCategoryOption[] = [],
) {
  const rows = parseCsv(text);
  const results = validateProductImportRows(rows, catalogType, categories);
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
