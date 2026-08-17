import { prisma } from '@/lib/prisma'

export interface SupplierInput {
  name: string
  contactName?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
}

export async function createSupplier(companyId: string, data: SupplierInput) {
  return prisma.supplier.create({ data: { companyId, ...data } })
}

export async function updateSupplier(supplierId: string, companyId: string, data: SupplierInput) {
  const existing = await prisma.supplier.findFirst({ where: { id: supplierId, companyId } })
  if (!existing) throw new Error('Proveedor no encontrado')
  return prisma.supplier.update({ where: { id: supplierId }, data })
}

export async function deleteSupplier(supplierId: string, companyId: string) {
  const existing = await prisma.supplier.findFirst({ where: { id: supplierId, companyId } })
  if (!existing) throw new Error('Proveedor no encontrado')
  await prisma.supplier.delete({ where: { id: supplierId } })
  return { ok: true }
}

export async function listSuppliers(companyId: string, search?: string) {
  return prisma.supplier.findMany({
    where: {
      companyId,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    },
    orderBy: { name: 'asc' },
    include: {
      products: { select: { id: true, name: true } },
      purchaseOrders: { select: { id: true, total: true, status: true, createdAt: true } },
    },
  })
}

export async function getSupplierStats(supplierId: string, companyId: string) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, companyId },
    include: { products: true, purchaseOrders: true },
  })
  if (!supplier) throw new Error('Proveedor no encontrado')

  const totalPurchases = supplier.purchaseOrders.reduce((acc, po) => acc + Number(po.total), 0)
  const pendingTotal = supplier.purchaseOrders
    .filter((po) => po.status === 'PENDIENTE')
    .reduce((acc, po) => acc + Number(po.total), 0)
  const lastPurchase = supplier.purchaseOrders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0]

  return {
    productCount: supplier.products.length,
    totalPurchases,
    pendingTotal,
    purchaseCount: supplier.purchaseOrders.length,
    lastPurchaseDate: lastPurchase?.createdAt ?? null,
  }
}