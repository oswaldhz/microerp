import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotificationType } from '@/generated/prisma/enums'

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  aggregate: vi.fn(),
  count: vi.fn(),
  createMany: vi.fn(),
  groupBy: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: { findFirst: mocks.findFirst, findMany: mocks.findMany, create: mocks.create, update: mocks.update, delete: mocks.delete },
    saleItem: { aggregate: mocks.aggregate, count: mocks.count },
    notification: { create: mocks.create, createMany: mocks.createMany },
    sale: { groupBy: mocks.groupBy },
  },
}))

import { createProduct, updateProduct, deleteProduct, lowStockProducts, adjustStock, getPurchaseRecommendation, inventoryValue } from '@/services/products.service'

const COMPANY = 'comp-1'

const BASE = { sku: 'NIK-1', name: 'Nike Air Max', purchasePrice: 4500, salePrice: 8950, stock: 10, minStock: 2, categoryId: 'cat-1', supplierId: 'sup-1' }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createProduct', () => {
  it('rechaza SKU duplicado', async () => {
    mocks.findFirst.mockResolvedValue({ id: 'p1' })
    await expect(createProduct(COMPANY, BASE)).rejects.toThrow('SKU')
  })

  it('crea producto si el SKU es único', async () => {
    mocks.findFirst.mockResolvedValue(null)
    mocks.create.mockResolvedValue({ id: 'p1', ...BASE })
    const result = await createProduct(COMPANY, BASE)
    expect(result.id).toBe('p1')
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ companyId: COMPANY, sku: 'NIK-1' }) }))
  })
})

describe('updateProduct', () => {
  it('rechaza si el producto no pertenece a la empresa', async () => {
    mocks.findFirst.mockResolvedValue(null)
    await expect(updateProduct('p1', COMPANY, BASE)).rejects.toThrow('no encontrado')
  })

  it('rechaza SKU en uso por otro producto', async () => {
    mocks.findFirst.mockResolvedValueOnce({ id: 'p1' }).mockResolvedValueOnce({ id: 'p2' })
    await expect(updateProduct('p1', COMPANY, BASE)).rejects.toThrow('SKU')
  })
})

describe('deleteProduct', () => {
  it('rechaza eliminar producto con ventas', async () => {
    mocks.findFirst.mockResolvedValue({ id: 'p1' })
    mocks.count.mockResolvedValue(3)
    await expect(deleteProduct('p1', COMPANY)).rejects.toThrow('ventas registradas')
  })

  it('elimina producto sin ventas', async () => {
    mocks.findFirst.mockResolvedValue({ id: 'p1' })
    mocks.count.mockResolvedValue(0)
    mocks.delete.mockResolvedValue({ id: 'p1' })
    await expect(deleteProduct('p1', COMPANY)).resolves.toEqual({ ok: true })
    expect(mocks.delete).toHaveBeenCalledWith({ where: { id: 'p1' } })
  })
})

describe('lowStockProducts', () => {
  it('filtra en JS los productos bajo el mínimo', async () => {
    mocks.findMany.mockResolvedValue([
      { id: 'p1', stock: 1, minStock: 2 },
      { id: 'p2', stock: 5, minStock: 2 },
      { id: 'p3', stock: 2, minStock: 2 },
    ])
    const result = await lowStockProducts(COMPANY)
    expect(result.map((p) => p.id)).toEqual(['p1', 'p3'])
  })
})

describe('adjustStock', () => {
  it('rechaza ajuste que deje stock negativo', async () => {
    mocks.findFirst.mockResolvedValue({ id: 'p1', stock: 2, minStock: 1 })
    await expect(adjustStock('p1', COMPANY, -5)).rejects.toThrow('negativo')
  })

  it('crea notificación si el stock queda bajo el mínimo', async () => {
    mocks.findFirst.mockResolvedValue({ id: 'p1', name: 'Nike', stock: 3, minStock: 2 })
    mocks.update.mockResolvedValue({ id: 'p1', name: 'Nike', stock: 1, minStock: 2 })
    await adjustStock('p1', COMPANY, -2)
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: NotificationType.STOCK_CRITICO, companyId: COMPANY }) }),
    )
  })
})

describe('getPurchaseRecommendation', () => {
  it('calcula sugerencia basada en venta promedio de 30 días', async () => {
    mocks.findFirst.mockResolvedValue({ id: 'p1', name: 'Nike', sku: 'NIK-1', stock: 5, minStock: 2 })
    mocks.aggregate.mockResolvedValue({ _sum: { quantity: 60 } })

    const rec = await getPurchaseRecommendation({ productId: 'p1', companyId: COMPANY, days: 30 })
    expect(rec.avgDailySales).toBe(2)
    // 2 uds/día * 14 días = 28 → menos 5 en stock = 23
    expect(rec.suggestedQuantity).toBe(23)
    expect(rec.daysOfCoverage).toBe(2.5)
  })

  it('sugiere 0 si el producto tiene cobertura suficiente', async () => {
    mocks.findFirst.mockResolvedValue({ id: 'p1', name: 'Nike', sku: 'NIK-1', stock: 50, minStock: 2 })
    mocks.aggregate.mockResolvedValue({ _sum: { quantity: 30 } })

    const rec = await getPurchaseRecommendation({ productId: 'p1', companyId: COMPANY, days: 30 })
    expect(rec.avgDailySales).toBe(1)
    expect(rec.suggestedQuantity).toBe(0)
  })

  it('sugiere 2x mínimo si no hay ventas pero el stock es bajo', async () => {
    mocks.findFirst.mockResolvedValue({ id: 'p1', name: 'Nike', sku: 'NIK-1', stock: 1, minStock: 3 })
    mocks.aggregate.mockResolvedValue({ _sum: { quantity: 0 } })

    const rec = await getPurchaseRecommendation({ productId: 'p1', companyId: COMPANY, days: 30 })
    expect(rec.avgDailySales).toBe(0)
    expect(rec.suggestedQuantity).toBe(6)
  })
})

describe('inventoryValue', () => {
  it('suma valor al costo y al retail', async () => {
    mocks.findMany.mockResolvedValue([
      { purchasePrice: 100, salePrice: 200, stock: 2 },
      { purchasePrice: 50, salePrice: 90, stock: 10 },
    ])
    const result = await inventoryValue(COMPANY)
    expect(result.costValue).toBe(700)
    expect(result.retailValue).toBe(1300)
  })
})