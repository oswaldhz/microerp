import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { requireSession, serverError } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  const checked = requireSession(session)
  if (checked instanceof NextResponse) return checked

  try {
    const [company, user] = await Promise.all([
      prisma.company.findUnique({
        where: { id: checked.companyId },
        select: { name: true, appName: true },
      }),
      prisma.user.findUnique({
        where: { id: checked.userId },
        select: { avatar: true, role: true },
      }),
    ])
    return NextResponse.json({
      appName: company?.appName ?? null,
      companyName: company?.name ?? '',
      avatar: user?.avatar ?? null,
      role: user?.role ?? null,
    })
  } catch (error) {
    return serverError(error)
  }
}