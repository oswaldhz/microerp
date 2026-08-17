import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSessionToken, SESSION_COOKIE } from '@/lib/auth'
import { authenticateUser } from '@/services/auth.service'
import { loginSchema, parseError } from '@/lib/validators'
import { logAudit } from '@/services/audit.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parseError(parsed.error) }, { status: 400 })
    }

    const result = await authenticateUser(parsed.data.email, parsed.data.password)
    if (!result) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }
    if (!result.ok) {
      return NextResponse.json({ error: 'Tu cuenta está dada de baja. Contacta al administrador.' }, { status: 403 })
    }
    const user = result.user

    const token = await createSessionToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    })
    const store = await cookies()
    store.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * Number(process.env.SESSION_TTL_HOURS ?? 12),
    })

    await logAudit({
      userId: user.id,
      companyId: user.companyId,
      action: 'LOGIN',
      entity: 'USER',
      entityId: user.id,
      details: `Inicio de sesión de ${user.email}`,
    })

    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.companyId } })
  } catch (error) {
    return NextResponse.json({ error: parseError(error) }, { status: 500 })
  }
}