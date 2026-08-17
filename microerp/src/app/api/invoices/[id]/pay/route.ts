import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { requirePermission, serverError, badRequest } from '@/lib/api-helpers'
import { registerInvoicePayment } from '@/services/invoices.service'
import { paymentSchema, parseError } from '@/lib/validators'
import { logAudit } from '@/services/audit.service'

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const checked = requirePermission(session, 'invoices.manage')
  if (checked instanceof NextResponse) return checked

  try {
    const { id } = await context.params
    const body = await request.json()
    const parsed = paymentSchema.safeParse(body)
    if (!parsed.success) return badRequest(parseError(parsed.error))

    const result = await registerInvoicePayment(id, checked.companyId, parsed.data.amount, parsed.data.method)
    await logAudit({
      userId: checked.userId,
      companyId: checked.companyId,
      action: 'PAY_INVOICE',
      entity: 'INVOICE',
      entityId: id,
      details: `Pago de ${parsed.data.amount} a la factura #${id}`,
    })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return serverError(error)
  }
}