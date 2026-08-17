import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { requirePermission, serverError } from '@/lib/api-helpers'
import { getSale } from '@/services/sales.service'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const checked = requirePermission(session, 'sales.view')
  if (checked instanceof NextResponse) return checked

  try {
    const { id } = await context.params
    const sale = await getSale(id, checked.companyId)
    return NextResponse.json({ sale })
  } catch (error) {
    return serverError(error)
  }
}