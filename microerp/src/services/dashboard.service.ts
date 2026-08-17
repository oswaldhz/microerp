import { prisma } from '@/lib/prisma'
import { round2, startOfDay, daysAgo, thisMonthStart } from '@/lib/utils'
import { SaleStatus, InvoiceStatus } from '@/generated/prisma/enums'

export async function dashboardData(companyId: string) {
  const today = startOfDay(new Date())
  const weekStart = daysAgo(7)
  const lastWeekStart = daysAgo(14)
  const monthStart = thisMonthStart()

  const [salesToday, salesWeek, lastWeek, salesMonth, expensesMonth, productCount, customerCount, pendingInvoices, products, salesByDayRaw] =
    await Promise.all([
      prisma.sale.aggregate({
        where: { companyId, status: SaleStatus.COMPLETADA, createdAt: { gte: today } },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.sale.aggregate({
        where: { companyId, status: SaleStatus.COMPLETADA, createdAt: { gte: weekStart } },
        _sum: { total: true },
      }),
      prisma.sale.aggregate({
        where: { companyId, status: SaleStatus.COMPLETADA, createdAt: { gte: lastWeekStart, lt: weekStart } },
        _sum: { total: true },
      }),
      prisma.sale.aggregate({
        where: { companyId, status: SaleStatus.COMPLETADA, createdAt: { gte: monthStart } },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.expense.aggregate({
        where: { companyId, date: { gte: monthStart } },
        _sum: { amount: true },
      }),
      prisma.product.count({ where: { companyId } }),
      prisma.customer.count({ where: { companyId } }),
      prisma.invoice.count({ where: { companyId, status: InvoiceStatus.PENDIENTE } }),
      prisma.product.findMany({ where: { companyId }, select: { id: true, stock: true, minStock: true } }),
      prisma.sale.groupBy({
        by: ['createdAt'],
        where: { companyId, status: SaleStatus.COMPLETADA, createdAt: { gte: weekStart } },
        _sum: { total: true },
      }),
    ])

  const lowStockCount = products.filter((p) => Number(p.stock) <= Number(p.minStock)).length

  const days: { label: string; total: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const day = daysAgo(i)
    const total = salesByDayRaw
      .filter((s) => startOfDay(s.createdAt).getTime() === day.getTime())
      .reduce((acc, s) => acc + Number(s._sum.total ?? 0), 0)
    days.push({ label: day.toLocaleDateString('es-DO', { day: '2-digit', month: 'short' }), total: round2(total) })
  }

  const currentWeek = Number(salesWeek._sum.total ?? 0)
  const previousWeek = Number(lastWeek._sum.total ?? 0)
  const weekChange =
    previousWeek > 0 ? round2(((currentWeek - previousWeek) / previousWeek) * 100) : currentWeek > 0 ? 100 : 0

  return {
    salesToday: Number(salesToday._sum.total ?? 0),
    salesTodayCount: salesToday._count.id,
    salesWeek: currentWeek,
    salesMonth: Number(salesMonth._sum.total ?? 0),
    salesMonthCount: salesMonth._count.id,
    expensesMonth: Number(expensesMonth._sum.amount ?? 0),
    profitMonth: round2(Number(salesMonth._sum.total ?? 0) - Number(expensesMonth._sum.amount ?? 0)),
    productCount,
    customerCount,
    lowStockCount,
    pendingInvoices,
    weekChange,
    salesByDay: days,
  }
}