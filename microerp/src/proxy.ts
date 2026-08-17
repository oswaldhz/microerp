import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth'

const PUBLIC_PATHS = ['/login']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isApi = pathname.startsWith('/api')
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  const isStatic = pathname.startsWith('/_next') || pathname.startsWith('/favicon.ico')

  if (isApi || isPublic || isStatic) {
    return NextResponse.next()
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value
  const session = token ? verifySessionToken(token) : null

  if (!session) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}