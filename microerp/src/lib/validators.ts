import { z } from 'zod'
import { normalizePhone } from '@/lib/utils'

export const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export const companySchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  rnc: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? normalizePhone(v) : v))
    .refine((v) => !v || v.length === 10, { message: 'El teléfono debe tener 10 dígitos' }),
})

export const userSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['ADMIN', 'VENDEDOR', 'CONTADOR']),
})

export const productSchema = z.object({
  sku: z.string().min(1, 'El SKU es obligatorio'),
  name: z.string().min(2, 'El nombre es obligatorio'),
  description: z.string().optional().nullable(),
  categoryId: z.string().min(1, 'La categoría es obligatoria'),
  purchasePrice: z.coerce.number().nonnegative('El precio de compra no puede ser negativo'),
  salePrice: z.coerce.number().positive('El precio de venta debe ser mayor que 0'),
  stock: z.coerce.number().int().nonnegative('El stock no puede ser negativo'),
  minStock: z.coerce.number().int().nonnegative('El stock mínimo no puede ser negativo'),
  supplierId: z.string().optional().nullable(),
})

export const categorySchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
})

export const customerSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  email: z.string().email('Correo inválido').optional().or(z.literal('')).nullable(),
  phone: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? normalizePhone(v) : v))
    .refine((v) => !v || v.length === 10, { message: 'El teléfono debe tener 10 dígitos' }),
  address: z.string().optional().nullable(),
  level: z.enum(['BRONCE', 'PLATA', 'ORO']).default('BRONCE'),
})

export const supplierSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  contactName: z.string().optional().nullable(),
  phone: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? normalizePhone(v) : v))
    .refine((v) => !v || v.length === 10, { message: 'El teléfono debe tener 10 dígitos' }),
  email: z.string().email('Correo inválido').optional().or(z.literal('')).nullable(),
  address: z.string().optional().nullable(),
})

export const employeePasswordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña no puede superar 72 caracteres')
  .regex(/[A-Za-z]/, 'La contraseña debe incluir letras')
  .regex(/[0-9]/, 'La contraseña debe incluir al menos un número')

export const employeeSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  position: z.string().min(2, 'El cargo es obligatorio'),
  phone: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? normalizePhone(v) : v))
    .refine((v) => !v || v.length === 10, { message: 'El teléfono debe tener 10 dígitos' }),
  email: z.string().email('Correo inválido').optional().or(z.literal('')).nullable(),
  salary: z.coerce.number().nonnegative('El salario no puede ser negativo'),
  commission: z.coerce.number().min(0).max(100, 'La comisión no puede superar 100%'),
  password: z.union([employeePasswordSchema, z.literal('')]).optional(),
})

export const expenseSchema = z.object({
  description: z.string().min(2, 'La descripción es obligatoria'),
  category: z.string().min(2, 'La categoría es obligatoria'),
  amount: z.coerce.number().positive('El monto debe ser mayor que 0'),
  date: z.coerce.date().optional(),
})

export const saleItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive('La cantidad debe ser mayor que 0'),
})

export const saleSchema = z.object({
  customerId: z.string().optional().nullable(),
  discount: z.coerce.number().nonnegative().default(0),
  paymentMethod: z.enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA']).default('EFECTIVO'),
  items: z.array(saleItemSchema).min(1, 'Debe agregar al menos un producto'),
})

export const invoiceSchema = z.object({
  customerId: z.string().optional().nullable(),
  subtotal: z.coerce.number().positive('El subtotal debe ser mayor que 0'),
  tax: z.coerce.number().nonnegative().default(0),
  dueDate: z.coerce.date().optional().nullable(),
})

export const paymentSchema = z.object({
  amount: z.coerce.number().positive('El monto debe ser mayor que 0'),
  method: z.enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA']).default('EFECTIVO'),
})

export const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'El proveedor es obligatorio'),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().positive(),
        unitPrice: z.coerce.number().positive(),
      }),
    )
    .min(1, 'Debe agregar al menos un producto'),
})

export const recommendationSchema = z.object({
  productId: z.string().min(1),
  days: z.coerce.number().int().min(1).max(90).default(30),
})

export const idParamSchema = z.object({
  id: z.string().min(1),
})

export function parseError(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues.map((i) => i.message).join(', ')
  }
  if (error instanceof Error) return error.message
  return 'Error desconocido'
}