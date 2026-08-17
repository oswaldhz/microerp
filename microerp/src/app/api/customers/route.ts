import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { requirePermission, serverError, badRequest } from '@/lib/api-helpers'
import { createCustomer, updateCustomer, deleteCustomer, listCustomers, getCustomerStats } from '@/services/customers.service'
import { customerSchema, parseError } from '@/lib/validators'
import { logAudit } from '@/services/audit.service'

export async function GET(request: NextRequest) {
  const session = await getSession()
  const checked = requirePermission(session, 'customers.view')
  if (checked instanceof NextResponse) return checked

  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') ?? undefined

    if (searchParams.get('stats') === 'true') {
      const stats = await getCustomerStats(searchParams.get('id')!, checked.companyId)
      return NextResponse.json({ stats })
    }

    const customers = await listCustomers(checked.companyId, search)
    return NextResponse.json({ customers })
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  const checked = requirePermission(session, 'customers.manage')
  if (checked instanceof NextResponse) return checked

  try {
    const body = await request.json()
    const parsed = customerSchema.safeParse(body)
    if (!parsed.success) return badRequest(parseError(parsed.error))

    const customer = await createCustomer(checked.companyId, parsed.data)
    await logAudit({
      userId: checked.userId,
      companyId: checked.companyId,
      action: 'CREATE_CUSTOMER',
      entity: 'CUSTOMER',
      entityId: customer.id,
      details: `Cliente "${customer.name}"`,
    })
    return NextResponse.json({ customer }, { status: 201 })
  } catch (error) {
    return serverError(error)
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  const checked = requirePermission(session, 'customers.manage')
  if (checked instanceof NextResponse) return checked

  try {
    const id = request.nextUrl.searchParams.get('id') ?? ''
    const body = await request.json()
    const parsed = customerSchema.safeParse(body)
    if (!parsed.success) return badRequest(parseError(parsed.error))

    const customer = await updateCustomer(id, checked.companyId, parsed.data)
    await logAudit({
      userId: checked.userId,
      companyId: checked.companyId,
      action: 'UPDATE_CUSTOMER',
      entity: 'CUSTOMER',
      entityId: customer.id,
      details: `Cliente "${customer.name}" actualizado`,
    })
    return NextResponse.json({ customer })
  } catch (error) {
    return serverError(error)
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession()
  const checked = requirePermission(session, 'customers.manage')
  if (checked instanceof NextResponse) return checked

  try {
    const id = request.nextUrl.searchParams.get('id') ?? ''
    const result = await deleteCustomer(id, checked.companyId)
    await logAudit({
      userId: checked.userId,
      companyId: checked.companyId,
      action: 'DELETE_CUSTOMER',
      entity: 'CUSTOMER',
      entityId: id,
      details: 'Cliente eliminado',
    })
    return NextResponse.json(result)
  } catch (error) {
    return serverError(error)
  }
}