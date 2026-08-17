import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { Role } from '@/generated/prisma/enums'
import { prisma } from '@/lib/prisma'

export const SESSION_COOKIE = 'microerp_session'

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret')

const ttlHours = () => Number(process.env.SESSION_TTL_HOURS ?? 12)

export interface SessionPayload {
  userId: string
  name: string
  email: string
  role: Role
  companyId: string
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ttlHours()}h`)
    .sign(secret())
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret())
    if (!payload.userId || !payload.companyId || !payload.role) return null
    return {
      userId: String(payload.userId),
      name: String(payload.name ?? ''),
      email: String(payload.email ?? ''),
      role: payload.role as Role,
      companyId: String(payload.companyId),
    }
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  const session = await verifySessionToken(token)
  if (!session) return null

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { active: true },
  })
  if (!user?.active) return null

  return session
}