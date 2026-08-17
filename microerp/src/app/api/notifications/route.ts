import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { requireSession, serverError } from '@/lib/api-helpers'
import { listNotifications, unreadCount, markAllRead } from '@/services/notifications.service'

export async function GET() {
  const session = await getSession()
  const checked = requireSession(session)
  if (checked instanceof NextResponse) return checked

  try {
    const [notifications, unread] = await Promise.all([
      listNotifications(checked.companyId),
      unreadCount(checked.companyId),
    ])
    return NextResponse.json({ notifications, unread })
  } catch (error) {
    return serverError(error)
  }
}

export async function PUT() {
  const session = await getSession()
  const checked = requireSession(session)
  if (checked instanceof NextResponse) return checked

  try {
    const result = await markAllRead(checked.companyId)
    return NextResponse.json(result)
  } catch (error) {
    return serverError(error)
  }
}