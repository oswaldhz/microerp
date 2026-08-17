import { prisma } from '@/lib/prisma'
import { computeTotals, round2 } from '@/lib/utils'
import { PaymentMethod, SaleStatus, NotificationType } from '@/generated/prisma/enums'

export interface SaleItemInput {
  productId: string
  quantity: number
}

export interface CreateSaleInput {
  companyId: string
  userId: string
  employeeId?: string | null
  customerId?: string | null
  discount?: number
  paymentMethod?: PaymentMethod
  items: SaleItemInput[]
}

export async function nextSaleNumber(companyId: string): Promise<number> {
  const last = await prisma.sale.findFirst({
    where: { companyId },
    orderBy: { number: 'desc' },
    select: { number: true },
  })
  return (last?.number ?? 0) + 1
}

export async function createSale(input: CreateSaleInput) {
  const discount = round2(input.discount ?? 0)
  const method = input.paymentMethod ?? PaymentMethod.EFECTIVO

  const products = await prisma.product.findMany({
    where: { id: { in: input.items.map((i) => i.productId) }, companyId: input.companyId },
  })

  if (products.length !== input.items.length) {
    throw new Error('Uno o más productos no existen en esta empresa')
  }

  const lines = input.items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!
    if (product.stock < item.quantity) {
      throw new Error(`Stock insuficiente para "${product.name}" (disponible: ${product.stock})`)
    }
    const unitPrice = Number(product.salePrice)
    const lineSubtotal = round2(unitPrice * item.quantity)
    return { product, quantity: item.quantity, unitPrice, lineSubtotal }
  })

  const subtotal = round2(lines.reduce((acc, l) => acc + l.lineSubtotal, 0))
  const totals = computeTotals(subtotal, discount)
  const number = await nextSaleNumber(input.companyId)

  const sale = await prisma.$transaction(async (tx) => {
    const created = await tx.sale.create({
      data: {
        number,
        companyId: input.companyId,
        userId: input.userId,
        employeeId: input.employeeId ?? null,
        customerId: input.customerId ?? null,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
        paymentMethod: method,
        status: SaleStatus.COMPLETADA,
        items: {
          create: lines.map((l) => ({
            productId: l.product.id,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            subtotal: l.lineSubtotal,
          })),
        },
        payments: {
          create: { amount: totals.total, method, companyId: input.companyId },
        },
      },
      include: { items: { include: { product: true } }, customer: true, employee: true },
    })

    for (const l of lines) {
      await tx.product.update({
        where: { id: l.product.id },
        data: { stock: { decrement: l.quantity } },
      })
    }

    for (const l of lines) {
      const updated = await tx.product.findUnique({ where: { id: l.product.id } })
      if (updated && updated.stock <= updated.minStock) {
        await tx.notification.create({
          data: {
            type: NotificationType.STOCK_CRITICO,
            companyId: input.companyId,
            message: `"${l.product.name}" tiene ${updated.stock} unidades (mínimo: ${updated.minStock})`,
          },
        })
      }
    }

    return created
  })

  return sale
}

export async function refundSale(saleId: string, companyId: string) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findFirst({
      where: { id: saleId, companyId },
      include: { items: true },
    })
    if (!sale) throw new Error('Venta no encontrada')
    if (sale.status === SaleStatus.DEVUELTA) throw new Error('La venta ya fue devuelta')

    for (const item of sale.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      })
    }
    return tx.sale.update({
      where: { id: sale.id },
      data: { status: SaleStatus.DEVUELTA },
    })
  })
}

export async function listSales(companyId: string, opts: { from?: Date; to?: Date; limit?: number } = {}) {
  return prisma.sale.findMany({
    where: {
      companyId,
      createdAt: { gte: opts.from, lte: opts.to },
    },
    orderBy: { createdAt: 'desc' },
    take: opts.limit ?? 100,
    include: {
      customer: { select: { id: true, name: true } },
      employee: { select: { id: true, name: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true } } } },
    },
  })
}

export async function getSale(saleId: string, companyId: string) {
  const sale = await prisma.sale.findFirst({
    where: { id: saleId, companyId },
    include: {
      customer: true,
      employee: true,
      items: { include: { product: true } },
      payments: true,
    },
  })
  if (!sale) throw new Error('Venta no encontrada')
  return sale
}

export async function salesByEmployee(companyId: string, from: Date, to: Date) {
  const sales = await prisma.sale.groupBy({
    by: ['employeeId'],
    where: { companyId, status: SaleStatus.COMPLETADA, createdAt: { gte: from, lte: to } },
    _sum: { total: true },
    _count: { id: true },
  })
  const employees = await prisma.employee.findMany({
    where: { companyId, id: { in: sales.map((s) => s.employeeId!).filter(Boolean) } },
    select: { id: true, name: true },
  })
  return sales
    .filter((s) => s.employeeId)
    .map((s) => ({
      employeeId: s.employeeId,
      name: employees.find((e) => e.id === s.employeeId)?.name ?? 'Desconocido',
      total: Number(s._sum.total ?? 0),
      transactions: s._count.id,
    }))
    .sort((a, b) => b.total - a.total)
}