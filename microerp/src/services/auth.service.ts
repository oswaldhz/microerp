import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { Role } from '@/generated/prisma/enums'

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.active) return null

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return null

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    companyId: user.companyId,
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function createUser(input: {
  name: string
  email: string
  password: string
  role: Role
  companyId: string
}) {
  const passwordHash = await hashPassword(input.password)
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      companyId: input.companyId,
    },
    select: { id: true, name: true, email: true, role: true, companyId: true },
  })
}