import { prisma } from '@/lib/prisma'

export interface ExpenseInput {
  description: string
  category: string
  amount: number
  date?: Date
}

export async function createExpense(companyId: string, data: ExpenseInput) {
  return prisma.expense.create({
    data: { companyId, ...data, amount: data.amount },
  })
}

export async function updateExpense(expenseId: string, companyId: string, data: ExpenseInput) {
  const existing = await prisma.expense.findFirst({ where: { id: expenseId, companyId } })
  if (!existing) throw new Error('Gasto no encontrado')
  return prisma.expense.update({
    where: { id: expenseId },
    data: { ...data, amount: data.amount },
  })
}

export async function deleteExpense(expenseId: string, companyId: string) {
  const existing = await prisma.expense.findFirst({ where: { id: expenseId, companyId } })
  if (!existing) throw new Error('Gasto no encontrado')
  await prisma.expense.delete({ where: { id: expenseId } })
  return { ok: true }
}

export async function listExpenses(
  companyId: string,
  opts: { from?: Date; to?: Date; category?: string; limit?: number } = {},
) {
  return prisma.expense.findMany({
    where: {
      companyId,
      date: { gte: opts.from, lte: opts.to },
      ...(opts.category ? { category: opts.category } : {}),
    },
    orderBy: { date: 'desc' },
    take: opts.limit ?? 100,
  })
}

export async function expenseCategories(companyId: string): Promise<string[]> {
  const rows = await prisma.expense.findMany({
    where: { companyId },
    select: { category: true },
    distinct: ['category'],
  })
  return rows.map((r) => r.category).sort()
}