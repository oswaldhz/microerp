import { prisma } from '@/lib/prisma'
import { round2 } from '@/lib/utils'
import { PurchaseOrderStatus } from '@/generated/prisma/enums'

export interface PurchaseOrderItemInput {
  productId: string
  quantity: number
  unitPrice: number
}

export async function nextPurchaseOrderNumber(companyId: string): Promise<number> {
  const last = await prisma.purchaseOrder.findFirst({
    where: { companyId },
    orderBy: { number: 'desc' },
    select: { number: true },
  })
  return (last?.number ?? 0) + 1
}

export async function createPurchaseOrder(
  companyId: string,
  supplierId: string,
  items: PurchaseOrderItemInput[],
) {
  const number = await nextPurchaseOrderNumber(companyId)
  const total = round2(items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0))

  return prisma.purchaseOrder.create({
    data: {
      number,
      companyId,
      supplierId,
      status: PurchaseOrderStatus.PENDIENTE,
      total,
      items: { create: items },
    },
    include: {
      supplier: { select: { id: true, name: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true } } } },
    },
  })
}

export async function receivePurchaseOrder(purchaseOrderId: string, companyId: string) {
  return prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findFirst({
      where: { id: purchaseOrderId, companyId },
      include: { items: true },
    })
    if (!po) throw new Error('Orden de compra no encontrada')
    if (po.status === PurchaseOrderStatus.RECIBIDA) throw new Error('La orden ya fue recibida')
    if (po.status === PurchaseOrderStatus.CANCELADA) throw new Error('La orden está cancelada')

    for (const item of po.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
          purchasePrice: item.unitPrice,
        },
      })
    }

    return tx.purchaseOrder.update({
      where: { id: po.id },
      data: { status: PurchaseOrderStatus.RECIBIDA },
      include: { items: { include: { product: true } }, supplier: true },
    })
  })
}

export async function cancelPurchaseOrder(purchaseOrderId: string, companyId: string) {
  const existing = await prisma.purchaseOrder.findFirst({ where: { id: purchaseOrderId, companyId } })
  if (!existing) throw new Error('Orden de compra no encontrada')
  if (existing.status !== PurchaseOrderStatus.PENDIENTE) {
    throw new Error('Solo se pueden cancelar órdenes pendientes')
  }
  return prisma.purchaseOrder.update({
    where: { id: purchaseOrderId },
    data: { status: PurchaseOrderStatus.CANCELADA },
  })
}

export async function listPurchaseOrders(companyId: string, limit = 100) {
  return prisma.purchaseOrder.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      supplier: { select: { id: true, name: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true } } } },
    },
  })
}