import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { requirePermission, serverError } from '@/lib/api-helpers'
import { receivePurchaseOrder, cancelPurchaseOrder } from '@/services/purchase-orders.service'
import { logAudit } from '@/services/audit.service'

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const checked = requirePermission(session, 'inventory.manage')
  if (checked instanceof NextResponse) return checked

  try {
    const { id } = await context.params
    const body = await request.json()
    const action = body?.action

    if (action === 'receive') {
      const order = await receivePurchaseOrder(id, checked.companyId)
      await logAudit({
        userId: checked.userId,
        companyId: checked.companyId,
        action: 'RECEIVE_PURCHASE_ORDER',
        entity: 'PURCHASE_ORDER',
        entityId: order.id,
        details: `Orden de compra #${order.number} recibida — stock actualizado`,
      })
      return NextResponse.json({ order })
    }

    const order = await cancelPurchaseOrder(id, checked.companyId)
    await logAudit({
      userId: checked.userId,
      companyId: checked.companyId,
      action: 'CANCEL_PURCHASE_ORDER',
      entity: 'PURCHASE_ORDER',
      entityId: order.id,
      details: `Orden de compra #${order.number} cancelada`,
    })
    return NextResponse.json({ order })
  } catch (error) {
    return serverError(error)
  }
}