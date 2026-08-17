import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { requirePermission, serverError } from '@/lib/api-helpers'
import { listAuditLogs } from '@/services/audit.service'

export async function GET() {
  const session = await getSession()
  const checked = requirePermission(session, 'audit.view')
  if (checked instanceof NextResponse) return checked

  try {
    const logs = await listAuditLogs(checked.companyId)
    return NextResponse.json({ logs })
  } catch (error) {
    return serverError(error)
  }
}