import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PaymentMethod, SaleStatus, NotificationType } from '@/generated/prisma/enums'

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findMany: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  groupBy: vi.fn(),
  aggregate: vi.fn(),
  count: vi.fn(),
  createMany: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    sale: {
      findFirst: mocks.findFirst,
      findMany: mocks.findMany,
      groupBy: mocks.groupBy,
      aggregate: mocks.aggregate,
    },
    saleItem: { aggregate: mocks.aggregate, count: mocks.count },
    product: { findMany: mocks.findMany, findUnique: mocks.findUnique, update: mocks.update, delete: mocks.delete },
    notification: { create: mocks.create, createMany: mocks.createMany },
    employee: { findMany: mocks.findMany },
    $transaction: mocks.transaction,
  },
}))

import { nextSaleNumber, createSale, refundSale, listSales, getSale, salesByEmployee } from '@/services/sales.service'
import { computeTotals } from '@/lib/utils'

const COMPANY = 'comp-1'
const USER = 'user-1'

const PRODUCT = {
  id: 'prod-1',
  name: 'Nike Air Max',
  sku: 'NIK-1',
  salePrice: 8950,
  purchasePrice: 4500,
  stock: 10,
  minStock: 2,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('nextSaleNumber', () => {
  it('devuelve 1 si no hay ventas previas', async () => {
    mocks.findFirst.mockResolvedValue(null)
    await expect(nextSaleNumber(COMPANY)).resolves.toBe(1)
  })

  it('incrementa el último número', async () => {
    mocks.findFirst.mockResolvedValue({ number: 7 })
    await expect(nextSaleNumber(COMPANY)).resolves.toBe(8)
  })
})

describe('createSale', () => {
  it('rechaza la venta si un producto no existe', async () => {
    mocks.findMany.mockResolvedValue([PRODUCT])
    await expect(
      createSale({ companyId: COMPANY, userId: USER, items: [{ productId: 'prod-1', quantity: 1 }, { productId: 'prod-999', quantity: 1 }] }),
    ).rejects.toThrow('no existen')
  })

  it('rechaza la venta si el stock es insuficiente', async () => {
    mocks.findMany.mockResolvedValue([PRODUCT])
    await expect(
      createSale({ companyId: COMPANY, userId: USER, items: [{ productId: 'prod-1', quantity: 11 }] }),
    ).rejects.toThrow('Stock insuficiente')
  })

  it('crea la venta en transacción con ITBIS y descuenta stock', async () => {
    mocks.findMany.mockResolvedValue([PRODUCT])
    mocks.findFirst.mockResolvedValue(null)
    const totals = computeTotals(8950, 0)
    const created = { id: 'sale-1', number: 1, total: totals.total }
    mocks.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        sale: { create: vi.fn().mockResolvedValue(created) },
        product: { update: vi.fn().mockResolvedValue({}), findUnique: vi.fn().mockResolvedValue({ ...PRODUCT, stock: 10 - 1 }) },
        notification: { create: vi.fn().mockResolvedValue({}) },
      }
      return cb(tx)
    })

    const sale = await createSale({ companyId: COMPANY, userId: USER, items: [{ productId: 'prod-1', quantity: 1 }], paymentMethod: PaymentMethod.EFECTIVO })

    expect(sale).toEqual(created)
    expect(mocks.transaction).toHaveBeenCalledOnce()
    const cb = mocks.transaction.mock.calls[0][0]
    const tx = {
      sale: { create: vi.fn().mockResolvedValue(created) },
      product: { update: vi.fn().mockResolvedValue({}), findUnique: vi.fn().mockResolvedValue({ ...PRODUCT, stock: 9 }) },
      notification: { create: vi.fn().mockResolvedValue({}) },
    }
    await cb(tx)
    expect(tx.sale.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          number: 1,
          subtotal: totals.subtotal,
          tax: totals.tax,
          total: totals.total,
        }),
      }),
    )
    expect(tx.product.update).toHaveBeenCalledWith({ where: { id: 'prod-1' }, data: { stock: { decrement: 1 } } })
  })

  it('crea notificación cuando el stock queda bajo el mínimo', async () => {
    mocks.findMany.mockResolvedValue([{ ...PRODUCT, stock: 1 }])
    mocks.findFirst.mockResolvedValue(null)
    mocks.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        sale: { create: vi.fn().mockResolvedValue({ id: 'sale-1', number: 1 }) },
        product: {
          update: vi.fn().mockResolvedValue({}),
          findUnique: vi.fn().mockResolvedValue({ ...PRODUCT, stock: 0 }),
        },
        notification: { create: vi.fn().mockResolvedValue({}) },
      }
      return cb(tx)
    })

    await createSale({ companyId: COMPANY, userId: USER, items: [{ productId: 'prod-1', quantity: 1 }] })
    const cb = mocks.transaction.mock.calls[0][0]
    const tx = {
      sale: { create: vi.fn().mockResolvedValue({ id: 'sale-1', number: 1 }) },
      product: { update: vi.fn().mockResolvedValue({}), findUnique: vi.fn().mockResolvedValue({ ...PRODUCT, stock: 0 }) },
      notification: { create: vi.fn().mockResolvedValue({}) },
    }
    await cb(tx)
    expect(tx.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: NotificationType.STOCK_CRITICO,
          companyId: COMPANY,
        }),
      }),
    )
  })
})

describe('refundSale', () => {
  it('devuelve stock y marca la venta como DEVUELTA', async () => {
    const sale = { id: 'sale-1', status: SaleStatus.COMPLETADA, items: [{ productId: 'prod-1', quantity: 3 }] }
    mocks.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        sale: {
          findFirst: vi.fn().mockResolvedValue(sale),
          update: vi.fn().mockResolvedValue({ ...sale, status: SaleStatus.DEVUELTA }),
        },
        product: { update: vi.fn().mockResolvedValue({}) },
      }
      return cb(tx)
    })

    const result = await refundSale('sale-1', COMPANY)
    expect(result.status).toBe(SaleStatus.DEVUELTA)

    const cb = mocks.transaction.mock.calls[0][0]
    const tx = {
      sale: { findFirst: vi.fn().mockResolvedValue(sale), update: vi.fn().mockResolvedValue({ ...sale, status: SaleStatus.DEVUELTA }) },
      product: { update: vi.fn().mockResolvedValue({}) },
    }
    await cb(tx)
    expect(tx.product.update).toHaveBeenCalledWith({ where: { id: 'prod-1' }, data: { stock: { increment: 3 } } })
  })

  it('rechaza devolver una venta ya devuelta', async () => {
    const sale = { id: 'sale-1', status: SaleStatus.DEVUELTA, items: [] }
    mocks.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = { sale: { findFirst: vi.fn().mockResolvedValue(sale) }, product: { update: vi.fn() } }
      return cb(tx)
    })
    await expect(refundSale('sale-1', COMPANY)).rejects.toThrow('ya fue devuelta')
  })
})

describe('listSales y getSale', () => {
  it('lista ventas con límite y filtros', async () => {
    mocks.findMany.mockResolvedValue([{ id: 'sale-1' }])
    const result = await listSales(COMPANY, { limit: 50 })
    expect(result).toHaveLength(1)
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50, include: expect.objectContaining({ customer: expect.anything() }) }),
    )
  })

  it('getSale lanza error si no existe', async () => {
    mocks.findFirst.mockResolvedValue(null)
    await expect(getSale('x', COMPANY)).rejects.toThrow('Venta no encontrada')
  })
})

describe('salesByEmployee', () => {
  it('agrupa ventas por empleado con nombre', async () => {
    mocks.groupBy.mockResolvedValue([{ employeeId: 'emp-1', _sum: { total: 100 }, _count: { id: 2 } }])
    mocks.findMany.mockResolvedValue([{ id: 'emp-1', name: 'Carlos' }])
    const result = await salesByEmployee(COMPANY, new Date('2026-01-01'), new Date('2026-02-01'))
    expect(result[0]).toMatchObject({ employeeId: 'emp-1', name: 'Carlos', total: 100, transactions: 2 })
  })
})