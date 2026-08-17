import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { requirePermission, serverError, badRequest } from '@/lib/api-helpers'
import { createSupplier, updateSupplier, deleteSupplier, listSuppliers, getSupplierStats } from '@/services/suppliers.service'
import { supplierSchema, parseError } from '@/lib/validators'
import { logAudit } from '@/services/audit.service'

export async function GET(request: NextRequest) {
  const session = await getSession()
  const checked = requirePermission(session, 'suppliers.view')
  if (checked instanceof NextResponse) return checked

  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') ?? undefined

    if (searchParams.get('stats') === 'true') {
      const stats = await getSupplierStats(searchParams.get('id')!, checked.companyId)
      return NextResponse.json({ stats })
    }

    const suppliers = await listSuppliers(checked.companyId, search)
    return NextResponse.json({ suppliers })
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  const checked = requirePermission(session, 'suppliers.manage')
  if (checked instanceof NextResponse) return checked

  try {
    const body = await request.json()
    const parsed = supplierSchema.safeParse(body)
    if (!parsed.success) return badRequest(parseError(parsed.error))

    const supplier = await createSupplier(checked.companyId, parsed.data)
    await logAudit({
      userId: checked.userId,
      companyId: checked.companyId,
      action: 'CREATE_SUPPLIER',
      entity: 'SUPPLIER',
      entityId: supplier.id,
      details: `Proveedor "${supplier.name}"`,
    })
    return NextResponse.json({ supplier }, { status: 201 })
  } catch (error) {
    return serverError(error)
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  const checked = requirePermission(session, 'suppliers.manage')
  if (checked instanceof NextResponse) return checked

  try {
    const id = request.nextUrl.searchParams.get('id') ?? ''
    const body = await request.json()
    const parsed = supplierSchema.safeParse(body)
    if (!parsed.success) return badRequest(parseError(parsed.error))

    const supplier = await updateSupplier(id, checked.companyId, parsed.data)
    await logAudit({
      userId: checked.userId,
      companyId: checked.companyId,
      action: 'UPDATE_SUPPLIER',
      entity: 'SUPPLIER',
      entityId: supplier.id,
      details: `Proveedor "${supplier.name}" actualizado`,
    })
    return NextResponse.json({ supplier })
  } catch (error) {
    return serverError(error)
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession()
  const checked = requirePermission(session, 'suppliers.manage')
  if (checked instanceof NextResponse) return checked

  try {
    const id = request.nextUrl.searchParams.get('id') ?? ''
    const result = await deleteSupplier(id, checked.companyId)
    await logAudit({
      userId: checked.userId,
      companyId: checked.companyId,
      action: 'DELETE_SUPPLIER',
      entity: 'SUPPLIER',
      entityId: id,
      details: 'Proveedor eliminado',
    })
    return NextResponse.json(result)
  } catch (error) {
    return serverError(error)
  }
}