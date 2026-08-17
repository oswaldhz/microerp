import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { requirePermission, serverError, badRequest } from '@/lib/api-helpers'
import { createInvoice, updateInvoice, cancelInvoice, listInvoices } from '@/services/invoices.service'
import { invoiceSchema, parseError } from '@/lib/validators'
import { logAudit } from '@/services/audit.service'
import { InvoiceStatus } from '@/generated/prisma/enums'

export async function GET(request: NextRequest) {
  const session = await getSession()
  const checked = requirePermission(session, 'invoices.view')
  if (checked instanceof NextResponse) return checked

  try {
    const searchParams = request.nextUrl.searchParams
    const status = (searchParams.get('status') as InvoiceStatus) ?? undefined
    const invoices = await listInvoices(checked.companyId, { status })
    return NextResponse.json({ invoices })
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  const checked = requirePermission(session, 'invoices.manage')
  if (checked instanceof NextResponse) return checked

  try {
    const body = await request.json()
    const parsed = invoiceSchema.safeParse(body)
    if (!parsed.success) return badRequest(parseError(parsed.error))

    const invoice = await createInvoice(checked.companyId, parsed.data)
    await logAudit({
      userId: checked.userId,
      companyId: checked.companyId,
      action: 'CREATE_INVOICE',
      entity: 'INVOICE',
      entityId: invoice.id,
      details: `Factura #${invoice.number} por ${Number(invoice.total).toFixed(2)}`,
    })
    return NextResponse.json({ invoice }, { status: 201 })
  } catch (error) {
    return serverError(error)
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  const checked = requirePermission(session, 'invoices.manage')
  if (checked instanceof NextResponse) return checked

  try {
    const id = request.nextUrl.searchParams.get('id') ?? ''
    const body = await request.json()
    const parsed = invoiceSchema.safeParse(body)
    if (!parsed.success) return badRequest(parseError(parsed.error))

    const invoice = await updateInvoice(id, checked.companyId, parsed.data)
    return NextResponse.json({ invoice })
  } catch (error) {
    return serverError(error)
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession()
  const checked = requirePermission(session, 'invoices.manage')
  if (checked instanceof NextResponse) return checked

  try {
    const id = request.nextUrl.searchParams.get('id') ?? ''
    const invoice = await cancelInvoice(id, checked.companyId)
    await logAudit({
      userId: checked.userId,
      companyId: checked.companyId,
      action: 'CANCEL_INVOICE',
      entity: 'INVOICE',
      entityId: invoice.id,
      details: `Factura #${invoice.number} cancelada`,
    })
    return NextResponse.json({ invoice })
  } catch (error) {
    return serverError(error)
  }
}