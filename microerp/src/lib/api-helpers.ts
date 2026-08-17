import { NextResponse } from 'next/server'
import type { SessionPayload } from '@/lib/auth'
import { can, Permission } from '@/lib/permissions'

export function unauthorized(message = 'No autorizado'): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function forbidden(message = 'Permiso denegado'): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 })
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 })
}

export function notFound(message = 'No encontrado'): NextResponse {
  return NextResponse.json({ error: message }, { status: 404 })
}

export function serverError(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : 'Error interno del servidor'
  return NextResponse.json({ error: message }, { status: 500 })
}

export function requireSession(session: SessionPayload | null): NextResponse | SessionPayload {
  if (!session) return unauthorized()
  return session
}

export function requirePermission(
  session: SessionPayload | null,
  permission: Permission,
): NextResponse | SessionPayload {
  const checked = requireSession(session)
  if (checked instanceof NextResponse) return checked
  if (!can(checked.role, permission)) return forbidden()
  return checked
}