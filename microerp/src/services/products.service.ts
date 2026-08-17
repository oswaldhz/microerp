import { prisma } from '@/lib/prisma'
import { round2 } from '@/lib/utils'
import { NotificationType } from '@/generated/prisma/enums'

export interface ProductInput {
  sku: string
  name: string
  description?: string | null
  categoryId: string
  purchasePrice: number
  salePrice: number
  stock: number
  minStock: number
  supplierId?: string | null
}

export async function createProduct(companyId: string, data: ProductInput) {
  const exists = await prisma.product.findFirst({ where: { companyId, sku: data.sku } })
  if (exists) throw new Error('Ya existe un producto con ese SKU')

  return prisma.product.create({
    data: {
      companyId,
      ...data,
      purchasePrice: data.purchasePrice,
      salePrice: data.salePrice,
    },
    include: { category: true, supplier: true },
  })
}

export async function updateProduct(productId: string, companyId: string, data: ProductInput) {
  const existing = await prisma.product.findFirst({ where: { id: productId, companyId } })
  if (!existing) throw new Error('Producto no encontrado')

  const dup = await prisma.product.findFirst({
    where: { companyId, sku: data.sku, id: { not: productId } },
  })
  if (dup) throw new Error('Ya existe otro producto con ese SKU')

  return prisma.product.update({
    where: { id: productId },
    data: {
      ...data,
      purchasePrice: data.purchasePrice,
      salePrice: data.salePrice,
    },
    include: { category: true, supplier: true },
  })
}

export async function deleteProduct(productId: string, companyId: string) {
  const existing = await prisma.product.findFirst({ where: { id: productId, companyId } })
  if (!existing) throw new Error('Producto no encontrado')
  const used = await prisma.saleItem.count({ where: { productId } })
  if (used > 0) throw new Error('No se puede eliminar: el producto tiene ventas registradas')
  await prisma.product.delete({ where: { id: productId } })
  return { ok: true }
}

export async function listProducts(companyId: string, search?: string) {
  return prisma.product.findMany({
    where: {
      companyId,
      ...(search
        ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { sku: { contains: search, mode: 'insensitive' } }] }
        : {}),
    },
    orderBy: { name: 'asc' },
    include: { category: true, supplier: true },
  })
}

export async function lowStockProducts(companyId: string) {
  const products = await prisma.product.findMany({
    where: { companyId },
    orderBy: { stock: 'asc' },
    include: { category: true, supplier: true },
  })
  return products.filter((p) => p.stock <= p.minStock)
}

export async function adjustStock(productId: string, companyId: string, delta: number) {
  const existing = await prisma.product.findFirst({ where: { id: productId, companyId } })
  if (!existing) throw new Error('Producto no encontrado')
  if (existing.stock + delta < 0) throw new Error('El ajuste dejaría el stock en negativo')

  const product = await prisma.product.update({
    where: { id: productId },
    data: { stock: { increment: delta } },
  })

  if (product.stock <= product.minStock) {
    await prisma.notification.create({
      data: {
        type: NotificationType.STOCK_CRITICO,
        companyId,
        message: `"${product.name}" tiene ${product.stock} unidades (mínimo: ${product.minStock})`,
      },
    })
  }
  return product
}

export interface RecommendationInput {
  productId: string
  companyId: string
  days?: number
}

export interface Recommendation {
  productId: string
  name: string
  sku: string
  stock: number
  minStock: number
  avgDailySales: number
  daysOfCoverage: number
  suggestedQuantity: number
}

export async function getPurchaseRecommendation(input: RecommendationInput): Promise<Recommendation> {
  const { productId, companyId, days = 30 } = input
  const product = await prisma.product.findFirst({ where: { id: productId, companyId } })
  if (!product) throw new Error('Producto no encontrado')

  const from = new Date()
  from.setDate(from.getDate() - days)
  from.setHours(0, 0, 0, 0)

  const agg = await prisma.saleItem.aggregate({
    where: { productId, sale: { companyId, createdAt: { gte: from } } },
    _sum: { quantity: true },
  })

  const sold = Number(agg._sum.quantity ?? 0)
  const avgDailySales = round2(sold / days)
  const daysOfCoverage = avgDailySales > 0 ? round2(product.stock / avgDailySales) : 99

  let suggestedQuantity = 0
  if (avgDailySales > 0) {
    suggestedQuantity = Math.max(Math.ceil(avgDailySales * 14) - product.stock, 0)
  } else if (product.stock <= product.minStock) {
    suggestedQuantity = product.minStock * 2
  }

  return {
    productId: product.id,
    name: product.name,
    sku: product.sku,
    stock: product.stock,
    minStock: product.minStock,
    avgDailySales,
    daysOfCoverage,
    suggestedQuantity,
  }
}

export async function inventoryValue(companyId: string) {
  const products = await prisma.product.findMany({ where: { companyId } })
  return {
    costValue: round2(products.reduce((acc, p) => acc + Number(p.purchasePrice) * p.stock, 0)),
    retailValue: round2(products.reduce((acc, p) => acc + Number(p.salePrice) * p.stock, 0)),
  }
}