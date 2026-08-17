import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { requirePermission, serverError } from '@/lib/api-helpers'
import { dashboardData } from '@/services/dashboard.service'

export async function GET() {
  const session = await getSession()
  const checked = requirePermission(session, 'dashboard.view')
  if (checked instanceof NextResponse) return checked

  try {
    const data = await dashboardData(checked.companyId)
    return NextResponse.json({ data })
  } catch (error) {
    return serverError(error)
  }
}