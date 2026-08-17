import { prisma } from '@/lib/prisma'
import { round2 } from '@/lib/utils'
import { SaleStatus, InvoiceStatus, CustomerLevel } from '@/generated/prisma/enums'

export interface ReportFilters {
  from?: Date
  to?: Date
}

export type SalesGroupBy = 'productId' | 'categoryId' | 'employeeId'

export async function salesReport(companyId: string, filters: ReportFilters = {}, groupBy: SalesGroupBy = 'productId') {
  const sales = await prisma.sale.findMany({
    where: {
      companyId,
      status: SaleStatus.COMPLETADA,
      createdAt: { gte: filters.from ?? new Date(0), lte: filters.to },
    },
    include: {
      items: { include: { product: { include: { category: true } } } },
      employee: { select: { id: true, name: true } },
    },
  })

  const map = new Map<string, { total: number; count: number; name: string }>()

  for (const sale of sales) {
    if (groupBy === 'employeeId') {
      const key = sale.employeeId ?? 'sin-empleado'
      const name = sale.employee?.name ?? 'Sin empleado'
      const entry = map.get(key) ?? { total: 0, count: 0, name }
      entry.total += Number(sale.total)
      entry.count += 1
      map.set(key, entry)
    } else {
      for (const item of sale.items) {
        const target = groupBy === 'productId' ? item.product : item.product.category
        const key = `${groupBy}:${target.id}`
        const entry = map.get(key) ?? { total: 0, count: 0, name: target.name }
        entry.total += Number(item.subtotal)
        entry.count += item.quantity
        map.set(key, entry)
      }
    }
  }

  return [...map.values()]
    .map((e) => ({ name: e.name, total: round2(e.total), count: e.count }))
    .sort((a, b) => b.total - a.total)
}

export async function profitReport(companyId: string, filters: ReportFilters = {}) {
  const where = { companyId, createdAt: { gte: filters.from, lte: filters.to } }

  const [salesAgg, expensesAgg] = await Promise.all([
    prisma.sale.aggregate({
      where: { ...where, status: SaleStatus.COMPLETADA },
      _sum: { total: true },
    }),
    prisma.expense.aggregate({
      where: { companyId, date: { gte: filters.from, lte: filters.to } },
      _sum: { amount: true },
    }),
  ])

  const saleItems = await prisma.saleItem.findMany({
    where: { sale: { ...where, status: SaleStatus.COMPLETADA } },
    include: { product: true },
  })
  const costOfGoods = saleItems.reduce((acc, i) => acc + Number(i.product.purchasePrice) * i.quantity, 0)

  const revenue = Number(salesAgg._sum.total ?? 0)
  const expenses = Number(expensesAgg._sum.amount ?? 0)
  const grossProfit = round2(revenue - costOfGoods)
  const netProfit = round2(grossProfit - expenses)

  return {
    revenue: round2(revenue),
    costOfGoods: round2(costOfGoods),
    expenses,
    grossProfit,
    netProfit,
    margin: revenue > 0 ? round2((netProfit / revenue) * 100) : 0,
  }
}

export async function inventoryReport(companyId: string) {
  const products = await prisma.product.findMany({
    where: { companyId },
    include: { category: true, supplier: { select: { name: true } } },
    orderBy: { name: 'asc' },
  })

  const totalValue = products.reduce((acc, p) => acc + Number(p.purchasePrice) * Number(p.stock), 0)
  const potentialRevenue = products.reduce((acc, p) => acc + Number(p.salePrice) * Number(p.stock), 0)

  return {
    totalProducts: products.length,
    totalUnits: products.reduce((acc, p) => acc + Number(p.stock), 0),
    totalValue: round2(totalValue),
    potentialRevenue: round2(potentialRevenue),
    lowStock: products.filter((p) => Number(p.stock) <= Number(p.minStock)),
    products: products.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category.name,
      supplier: p.supplier?.name ?? '—',
      stock: Number(p.stock),
      minStock: Number(p.minStock),
      purchasePrice: Number(p.purchasePrice),
      salePrice: Number(p.salePrice),
      value: round2(Number(p.purchasePrice) * Number(p.stock)),
    })),
  }
}

export async function customersReport(companyId: string) {
  const customers = await prisma.customer.findMany({
    where: { companyId },
    include: {
      _count: { select: { sales: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  const stats = await prisma.sale.groupBy({
    by: ['customerId'],
    where: { companyId, status: SaleStatus.COMPLETADA },
    _sum: { total: true },
    _count: { id: true },
  })

  const byLevel = {
    [CustomerLevel.BRONCE]: customers.filter((c) => c.level === CustomerLevel.BRONCE).length,
    [CustomerLevel.PLATA]: customers.filter((c) => c.level === CustomerLevel.PLATA).length,
    [CustomerLevel.ORO]: customers.filter((c) => c.level === CustomerLevel.ORO).length,
  }

  return {
    total: customers.length,
    byLevel,
    top: customers
      .map((c) => {
        const s = stats.find((x) => x.customerId === c.id)
        return {
          id: c.id,
          name: c.name,
          level: c.level,
          purchases: s?._count.id ?? 0,
          total: round2(Number(s?._sum.total ?? 0)),
        }
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 10),
  }
}

export async function pendingInvoicesReport(companyId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { companyId, status: InvoiceStatus.PENDIENTE },
    include: {
      customer: { select: { name: true } },
      payments: { select: { amount: true } },
    },
    orderBy: { dueDate: 'asc' },
  })

  const mapped = invoices.map((inv) => {
    const paid = inv.payments.reduce((acc, p) => acc + Number(p.amount), 0)
    const balance = round2(Number(inv.total) - paid)
    return {
      id: inv.id,
      number: inv.number,
      customer: inv.customer?.name ?? '—',
      total: Number(inv.total),
      paid,
      balance,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      daysOverdue: inv.dueDate ? Math.max(0, Math.ceil((new Date().getTime() - new Date(inv.dueDate).getTime()) / 86400000)) : 0,
    }
  })

  return {
    total: mapped.length,
    totalBalance: round2(mapped.reduce((acc, i) => acc + i.balance, 0)),
    invoices: mapped,
  }
}