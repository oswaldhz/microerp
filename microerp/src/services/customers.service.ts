import { prisma } from '@/lib/prisma'
import { CustomerLevel } from '@/generated/prisma/enums'

export interface CustomerInput {
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  level?: CustomerLevel
}

export async function createCustomer(companyId: string, data: CustomerInput) {
  return prisma.customer.create({
    data: { companyId, ...data },
  })
}

export async function updateCustomer(customerId: string, companyId: string, data: CustomerInput) {
  const existing = await prisma.customer.findFirst({ where: { id: customerId, companyId } })
  if (!existing) throw new Error('Cliente no encontrado')
  return prisma.customer.update({ where: { id: customerId }, data })
}

export async function deleteCustomer(customerId: string, companyId: string) {
  const existing = await prisma.customer.findFirst({ where: { id: customerId, companyId } })
  if (!existing) throw new Error('Cliente no encontrado')
  await prisma.customer.delete({ where: { id: customerId } })
  return { ok: true }
}

export async function listCustomers(companyId: string, search?: string) {
  return prisma.customer.findMany({
    where: {
      companyId,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    },
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { sales: true } },
    },
  })
}

export async function getCustomerStats(customerId: string, companyId: string) {
  const customer = await prisma.customer.findFirst({ where: { id: customerId, companyId } })
  if (!customer) throw new Error('Cliente no encontrado')

  const [sales, lastSale, favorite] = await Promise.all([
    prisma.sale.aggregate({
      where: { customerId, companyId, status: 'COMPLETADA' },
      _sum: { total: true },
      _count: { id: true },
    }),
    prisma.sale.findFirst({
      where: { customerId, companyId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
    prisma.saleItem.groupBy({
      by: ['productId'],
      where: { sale: { customerId, companyId, status: 'COMPLETADA' } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 1,
    }),
  ])

  let favoriteProduct = null
  if (favorite.length > 0) {
    favoriteProduct = await prisma.product.findUnique({
      where: { id: favorite[0].productId },
      select: { id: true, name: true },
    })
  }

  return {
    totalSpent: Number(sales._sum.total ?? 0),
    purchaseCount: sales._count.id,
    lastPurchaseDate: lastSale?.createdAt ?? null,
    favoriteProduct,
  }
}

export async function customerStatsAll(companyId: string) {
  const newCustomers = await prisma.customer.groupBy({
    by: ['createdAt'],
    where: { companyId },
    _count: { id: true },
  })

  const top = await prisma.sale.groupBy({
    by: ['customerId'],
    where: { companyId, status: 'COMPLETADA', customerId: { not: null } },
    _sum: { total: true },
    orderBy: { _sum: { total: 'desc' } },
    take: 10,
  })
  const customers = await prisma.customer.findMany({
    where: { companyId, id: { in: top.map((t) => t.customerId!).filter(Boolean) } },
  })

  return {
    totalCustomers: await prisma.customer.count({ where: { companyId } }),
    newCustomersThisMonth: newCustomers.filter(
      (c) => c.createdAt >= new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    ).length,
    topCustomers: top
      .filter((t) => t.customerId)
      .map((t) => ({
        id: t.customerId,
        name: customers.find((c) => c.id === t.customerId)?.name ?? 'Desconocido',
        total: Number(t._sum.total ?? 0),
      })),
  }
}