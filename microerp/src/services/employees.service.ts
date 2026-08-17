import { prisma } from '@/lib/prisma'

export interface EmployeeInput {
  name: string
  position: string
  phone?: string | null
  email?: string | null
  salary: number
  commission: number
}

export async function createEmployee(companyId: string, data: EmployeeInput) {
  return prisma.employee.create({
    data: { companyId, ...data, salary: data.salary, commission: data.commission },
  })
}

export async function updateEmployee(employeeId: string, companyId: string, data: EmployeeInput) {
  const existing = await prisma.employee.findFirst({ where: { id: employeeId, companyId } })
  if (!existing) throw new Error('Empleado no encontrado')
  return prisma.employee.update({
    where: { id: employeeId },
    data: { ...data, salary: data.salary, commission: data.commission },
  })
}

export async function deleteEmployee(employeeId: string, companyId: string) {
  const existing = await prisma.employee.findFirst({ where: { id: employeeId, companyId } })
  if (!existing) throw new Error('Empleado no encontrado')
  await prisma.employee.update({ where: { id: employeeId }, data: { active: false } })
  return { ok: true }
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