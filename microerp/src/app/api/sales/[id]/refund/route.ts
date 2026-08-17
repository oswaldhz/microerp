import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { requirePermission, serverError } from '@/lib/api-helpers'
import { refundSale } from '@/services/sales.service'
import { logAudit } from '@/services/audit.service'

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const checked = requirePermission(session, 'sales.refund')
  if (checked instanceof NextResponse) return checked

  try {
    const { id } = await context.params
    const sale = await refundSale(id, checked.companyId)
    await logAudit({
      userId: checked.userId,
      companyId: checked.companyId,
      action: 'REFUND_SALE',
      entity: 'SALE',
      entityId: sale.id,
      details: `Devolución de venta #${sale.number}`,
    })
    return NextResponse.json({ sale })
  } catch (error) {
    return serverError(error)
  }
}