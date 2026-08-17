import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { requirePermission, serverError, badRequest } from '@/lib/api-helpers'
import { createPurchaseOrder, listPurchaseOrders } from '@/services/purchase-orders.service'
import { purchaseOrderSchema, parseError } from '@/lib/validators'
import { logAudit } from '@/services/audit.service'

export async function GET() {
  const session = await getSession()
  const checked = requirePermission(session, 'suppliers.view')
  if (checked instanceof NextResponse) return checked

  try {
    const orders = await listPurchaseOrders(checked.companyId)
    return NextResponse.json({ orders })
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  const checked = requirePermission(session, 'inventory.manage')
  if (checked instanceof NextResponse) return checked

  try {
    const body = await request.json()
    const parsed = purchaseOrderSchema.safeParse(body)
    if (!parsed.success) return badRequest(parseError(parsed.error))

    const order = await createPurchaseOrder(checked.companyId, parsed.data.supplierId, parsed.data.items)
    await logAudit({
      userId: checked.userId,
      companyId: checked.companyId,
      action: 'CREATE_PURCHASE_ORDER',
      entity: 'PURCHASE_ORDER',
      entityId: order.id,
      details: `Orden de compra #${order.number} por ${Number(order.total).toFixed(2)}`,
    })
    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    return serverError(error)
  }
}