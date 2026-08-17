import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { requirePermission, serverError, badRequest } from '@/lib/api-helpers'
import { createCompany, listCompanies, updateCompany } from '@/services/companies.service'
import { companySchema, parseError } from '@/lib/validators'
import { logAudit } from '@/services/audit.service'
import { emitBrandingEvent } from '@/lib/branding-events'

export async function GET() {
  const session = await getSession()
  const checked = requirePermission(session, 'companies.manage')
  if (checked instanceof NextResponse) return checked

  try {
    const companies = await listCompanies()
    return NextResponse.json({ companies })
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  const checked = requirePermission(session, 'companies.manage')
  if (checked instanceof NextResponse) return checked

  try {
    const body = await request.json()
    const parsed = companySchema.safeParse(body)
    if (!parsed.success) return badRequest(parseError(parsed.error))

    const company = await createCompany(parsed.data)
    await logAudit({
      userId: checked.userId,
      companyId: checked.companyId,
      action: 'CREATE_COMPANY',
      entity: 'COMPANY',
      entityId: company.id,
      details: `Empresa "${company.name}"`,
    })
    return NextResponse.json({ company }, { status: 201 })
  } catch (error) {
    return serverError(error)
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  const checked = requirePermission(session, 'companies.manage')
  if (checked instanceof NextResponse) return checked

  try {
    const id = request.nextUrl.searchParams.get('id') ?? checked.companyId
    const body = await request.json()
    const parsed = companySchema.safeParse(body)
    if (!parsed.success) return badRequest(parseError(parsed.error))

    const company = await updateCompany(id, parsed.data)
    emitBrandingEvent(company.id)
    return NextResponse.json({ company })
  } catch (error) {
    return serverError(error)
  }
}