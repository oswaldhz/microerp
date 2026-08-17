import { prisma } from '@/lib/prisma'
import { emit } from '@/lib/session-hub'

export interface EmployeeInput {
  name: string
  position: string
  phone?: string | null
  email?: string | null
  salary: number
  commission: number
}

export async function createEmployee(companyId: string, data: EmployeeInput, userId?: string | null) {
  return prisma.employee.create({
    data: { companyId, ...data, salary: data.salary, commission: data.commission, userId: userId ?? undefined },
  })
}

export async function createLoginUser(input: {
  companyId: string
  name: string
  email: string
  passwordHash: string
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw new Error('Ya existe un usuario con ese correo')
  return prisma.user.create({
    data: {
      companyId: input.companyId,
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      role: 'VENDEDOR',
    },
    select: { id: true, name: true, email: true, role: true, active: true },
  })
}

export async function updateLoginUser(input: {
  companyId: string
  name: string
  email: string
  passwordHash: string
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing && existing.companyId !== input.companyId) {
    throw new Error('Ya existe un usuario con ese correo en otra empresa')
  }
  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: { name: input.name, passwordHash: input.passwordHash, active: true },
      select: { id: true, name: true, email: true, role: true, active: true },
    })
  }
  return prisma.user.create({
    data: {
      companyId: input.companyId,
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      role: 'VENDEDOR',
    },
    select: { id: true, name: true, email: true, role: true, active: true },
  })
}

export async function updateEmployee(
  employeeId: string,
  companyId: string,
  data: EmployeeInput,
  userId?: string | null,
) {
  const existing = await prisma.employee.findFirst({ where: { id: employeeId, companyId } })
  if (!existing) throw new Error('Empleado no encontrado')
  return prisma.employee.update({
    where: { id: employeeId },
    data: { ...data, salary: data.salary, commission: data.commission, userId: userId ?? undefined },
  })
}

export async function deleteEmployee(employeeId: string, companyId: string) {
  const existing = await prisma.employee.findFirst({ where: { id: employeeId, companyId } })
  if (!existing) throw new Error('Empleado no encontrado')
  await prisma.employee.update({ where: { id: employeeId }, data: { active: false } })
  return { ok: true }
}

export async function setEmployeeStatus(
  employeeId: string,
  companyId: string,
  active: boolean,
  actorUserId?: string,
) {
  const existing = await prisma.employee.findFirst({ where: { id: employeeId, companyId } })
  if (!existing) throw new Error('Empleado no encontrado')

  const employee = await prisma.employee.update({ where: { id: employeeId }, data: { active } })

  let user: { id: string } | null = null
  if (existing.userId) {
    user = await prisma.user.findFirst({ where: { id: existing.userId, companyId } })
  } else if (existing.email) {
    const byEmail = await prisma.user.findUnique({ where: { email: existing.email } })
    if (byEmail && byEmail.companyId === companyId) user = byEmail
  }

  if (user) {
    if (!active && user.id === actorUserId) {
      throw new Error('No puedes darte de baja a ti mismo')
    }
    await prisma.user.update({ where: { id: user.id }, data: { active } })
    if (!active) emit(user.id, JSON.stringify({ type: 'revoked' }))
  }

  return employee
}

export async function listEmployees(companyId: string, search?: string) {
  return prisma.employee.findMany({
    where: {
      companyId,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    },
    orderBy: { name: 'asc' },
    include: { _count: { select: { sales: true } } },
  })
}

export async function getEmployeeStats(employeeId: string, companyId: string) {
  const employee = await prisma.employee.findFirst({ where: { id: employeeId, companyId } })
  if (!employee) throw new Error('Empleado no encontrado')

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const [monthAgg, totalAgg, refunds] = await Promise.all([
    prisma.sale.aggregate({
      where: { employeeId, companyId, status: 'COMPLETADA', createdAt: { gte: monthStart } },
      _sum: { total: true },
      _count: { id: true },
    }),
    prisma.sale.aggregate({
      where: { employeeId, companyId, status: 'COMPLETADA' },
      _sum: { total: true },
      _count: { id: true },
    }),
    prisma.sale.count({ where: { employeeId, companyId, status: 'DEVUELTA' } }),
  ])

  return {
    monthSales: Number(monthAgg._sum.total ?? 0),
    monthTransactions: monthAgg._count.id,
    totalSales: Number(totalAgg._sum.total ?? 0),
    totalTransactions: totalAgg._count.id,
    refunds,
    commission: Math.round(Number(employee.commission) * 100) / 100,
  }
}