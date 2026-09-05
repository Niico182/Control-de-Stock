import { z } from "zod";
import { isValidArgDate } from "@/lib/dates";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

const optionalTextField = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const optionalCostField = z
  .union([z.literal(""), z.coerce.number().min(0, "El costo no puede ser negativo")])
  .optional()
  .transform((value) => (value === "" || value === undefined ? undefined : value));

const productActiveField = z
  .union([z.literal("true"), z.literal("false"), z.literal("")])
  .optional()
  .transform((value) => value !== "false");

const optionalCategoryIdField = z
  .union([z.literal(""), z.string().uuid("Categoría inválida")])
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

export const productCategorySchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(60, "Máximo 60 caracteres"),
  catalogType: z.enum(["SALE", "RENTAL"]),
});

export const updateProductCategorySchema = z.object({
  categoryId: z.string().uuid("Categoría inválida"),
  name: z.string().trim().min(1, "El nombre es obligatorio").max(60, "Máximo 60 caracteres"),
});

const variantOptionalPriceField = z.preprocess(
  (value) => (value === null || value === "" ? undefined : value),
  z.coerce.number().min(0, "El precio no puede ser negativo").optional(),
);

const variantOptionalCostField = z.preprocess(
  (value) => (value === null || value === "" ? undefined : value),
  z.coerce.number().min(0, "El costo no puede ser negativo").optional(),
);

const variantActiveField = z.preprocess(
  (value) => value,
  z
    .union([z.literal("true"), z.literal("false"), z.literal(""), z.boolean()])
    .optional()
    .transform((value) => value !== "false" && value !== false),
);

const productVariantDraftSchema = z.object({
  id: z.string().uuid().optional(),
  color: optionalTextField,
  quantity: z.coerce.number().int().min(0, "El stock no puede ser negativa"),
  price: variantOptionalPriceField,
  cost: variantOptionalCostField,
  sku: z.preprocess(
    (value) => (value === null || value === "" ? undefined : value),
    z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value.toUpperCase() : undefined)),
  ),
  isActive: variantActiveField,
});

export const productSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  basePrice: z.coerce.number().positive("El precio debe ser mayor a 0"),
  type: z.enum(["SALE", "RENTAL"]),
  categoryId: optionalCategoryIdField,
  description: optionalTextField,
  baseCost: optionalCostField,
  isActive: productActiveField,
  variants: z.array(productVariantDraftSchema).min(1, "Agregá al menos una variación"),
});

export const updateProductSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1, "El nombre es obligatorio"),
  basePrice: z.coerce.number().positive("El precio debe ser mayor a 0"),
  categoryId: optionalCategoryIdField,
  description: optionalTextField,
  baseCost: optionalCostField,
  isActive: z
    .union([z.literal("true"), z.literal("false")])
    .transform((value) => value === "true"),
  variants: z.array(productVariantDraftSchema).min(1, "Agregá al menos una variación"),
});

export const saleOrderSchema = z.object({
  clientName: z.string().min(1, "El nombre del cliente es obligatorio"),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productVariantId: z.string().uuid(),
        quantity: z.coerce.number().int().positive(),
        unitPrice: z.coerce.number().positive(),
      }),
    )
    .min(1, "Agregá al menos un producto"),
});

export const rentalOrderSchema = z.object({
  clientName: z.string().min(1, "El nombre del cliente es obligatorio"),
  address: z.string().min(1, "La dirección es obligatoria"),
  rentalDate: z
    .string()
    .min(1, "La fecha es obligatoria")
    .refine(isValidArgDate, "Usá el formato DD/MM/AAAA"),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productVariantId: z.string().uuid(),
        quantity: z.coerce.number().int().positive(),
        unitPrice: z.coerce.number().positive(),
      }),
    )
    .min(1, "Agregá al menos un producto"),
});

export const rentalReturnSchema = z.object({
  rentalOrderId: z.string().uuid(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productVariantId: z.string().uuid(),
      quantityReturned: z.coerce.number().int().min(0),
      quantityMissing: z.coerce.number().int().min(0),
    }),
  ),
});

export const createCompanySchema = z.object({
  companyName: z.string().min(2),
  adminName: z.string().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(6),
  enableSales: z.boolean().default(true),
  enableRentals: z.boolean().default(true),
});

export const inviteEmployeeSchema = z.object({
  email: z.string().email(),
  canManageProducts: z.boolean().default(false),
  canCreateOrders: z.boolean().default(true),
  canViewReports: z.boolean().default(false),
  canManageMembers: z.boolean().default(false),
});

export const companySettingsSchema = z.object({
  name: z.string().min(2),
  enableSales: z.boolean(),
  enableRentals: z.boolean(),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(2),
  password: z.string().min(6),
});
