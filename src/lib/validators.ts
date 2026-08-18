import { z } from "zod";
import { isValidArgDate } from "@/lib/dates";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const productSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  price: z.coerce.number().positive("El precio debe ser mayor a 0"),
  quantity: z.coerce.number().int().min(0, "La cantidad no puede ser negativa"),
  type: z.enum(["SALE", "RENTAL"]),
});

export const updateProductSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1, "El nombre es obligatorio"),
  price: z.coerce.number().positive("El precio debe ser mayor a 0"),
  quantity: z.coerce.number().int().min(0, "La cantidad no puede ser negativa"),
});

export const saleOrderSchema = z.object({
  clientName: z.string().min(1, "El nombre del cliente es obligatorio"),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
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
        productId: z.string().uuid(),
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
      productId: z.string().uuid(),
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
