import { prisma } from '@/lib/prisma'

export async function logAudit(input: {
  userId: string
  companyId: string
  action: string
  entity: string
  entityId?: string | null
  details?: string | null
}) {
  return prisma.auditLog.create({
    data: {
      userId: input.userId,
      companyId: input.companyId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      details: input.details ?? null,
    },
  })
}

export async function listAuditLogs(companyId: string, limit = 100) {
  return prisma.auditLog.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { user: { select: { id: true, name: true, email: true } } },
  })
}