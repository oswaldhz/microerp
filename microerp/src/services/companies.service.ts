import { prisma } from '@/lib/prisma'

export interface CompanyInput {
  name: string
  rnc?: string | null
  address?: string | null
  phone?: string | null
}

export async function createCompany(data: CompanyInput) {
  return prisma.company.create({ data })
}

export async function listCompanies() {
  return prisma.company.findMany({ orderBy: { name: 'asc' } })
}

export async function getCompany(companyId: string) {
  const company = await prisma.company.findUnique({ where: { id: companyId } })
  if (!company) throw new Error('Empresa no encontrada')
  return company
}

export async function updateCompany(companyId: string, data: CompanyInput) {
  const existing = await prisma.company.findUnique({ where: { id: companyId } })
  if (!existing) throw new Error('Empresa no encontrada')
  return prisma.company.update({ where: { id: companyId }, data })
}

export async function createUserForCompany(input: {
  companyId: string
  name: string
  email: string
  passwordHash: string
  role: 'ADMIN' | 'VENDEDOR' | 'CONTADOR'
}) {
  const emailExists = await prisma.user.findUnique({ where: { email: input.email } })
  if (emailExists) throw new Error('Ya existe un usuario con ese correo')
  return prisma.user.create({
    data: {
      companyId: input.companyId,
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role,
    },
    select: { id: true, name: true, email: true, role: true, companyId: true },
  })
}