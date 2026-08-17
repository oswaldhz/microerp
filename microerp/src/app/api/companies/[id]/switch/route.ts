import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { requireSession, serverError } from '@/lib/api-helpers'
import { getCompany } from '@/services/companies.service'
import { logAudit } from '@/services/audit.service'

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const checked = requireSession(session)
  if (checked instanceof NextResponse) return checked

  try {
    const { id } = await context.params
    const company = await getCompany(id)
    void company

    await logAudit({
      userId: checked.userId,
      companyId: checked.companyId,
      action: 'SWITCH_COMPANY',
      entity: 'COMPANY',
      entityId: id,
      details: `Cambio de empresa a "${company.name}"`,
    })

    return NextResponse.json({ companyId: id })
  } catch (error) {
    return serverError(error)
  }
}