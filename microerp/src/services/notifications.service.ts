import { prisma } from '@/lib/prisma'
import { NotificationType } from '@/generated/prisma/enums'

export async function listNotifications(companyId: string, limit = 50) {
  return prisma.notification.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export async function unreadCount(companyId: string): Promise<number> {
  return prisma.notification.count({ where: { companyId, read: false } })
}

export async function markAllRead(companyId: string) {
  await prisma.notification.updateMany({
    where: { companyId, read: false },
    data: { read: true },
  })
  return { ok: true }
}

export async function createNotification(
  companyId: string,
  type: NotificationType,
  message: string,
) {
  return prisma.notification.create({ data: { companyId, type, message } })
}

export async function generateStockNotifications(companyId: string) {
  const products = await prisma.product.findMany({ where: { companyId } })
  const low = products.filter((p) => p.stock <= p.minStock)
  const critical = low.filter((p) => p.stock === 0)

  const messages: string[] = []
  for (const p of critical) {
    const existing = await prisma.notification.findFirst({
      where: {
        companyId,
        type: NotificationType.STOCK_CRITICO,
        message: { contains: p.name },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    })
    if (!existing) {
      await prisma.notification.create({
        data: {
          companyId,
          type: NotificationType.STOCK_CRITICO,
          message: `"${p.name}" está agotado (${p.stock} unidades)`,
        },
      })
      messages.push(p.name)
    }
  }
  return { created: messages.length }
}