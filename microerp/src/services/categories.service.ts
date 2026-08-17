import { prisma } from '@/lib/prisma'

export async function createCategory(companyId: string, name: string) {
  const existing = await prisma.category.findFirst({ where: { companyId, name } })
  if (existing) throw new Error('Ya existe una categoría con ese nombre')
  return prisma.category.create({ data: { companyId, name } })
}

export async function listCategories(companyId: string) {
  return prisma.category.findMany({
    where: { companyId },
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  })
}

export async function deleteCategory(categoryId: string, companyId: string) {
  const existing = await prisma.category.findFirst({ where: { id: categoryId, companyId } })
  if (!existing) throw new Error('Categoría no encontrada')
  const used = await prisma.product.count({ where: { categoryId } })
  if (used > 0) throw new Error('No se puede eliminar: la categoría tiene productos')
  await prisma.category.delete({ where: { id: categoryId } })
  return { ok: true }
}