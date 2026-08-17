import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { requirePermission, serverError, badRequest } from '@/lib/api-helpers'
import { createSale, listSales } from '@/services/sales.service'
import { saleSchema, parseError } from '@/lib/validators'
import { logAudit } from '@/services/audit.service'

export async function GET(request: NextRequest) {
  const session = await getSession()
  const checked = requirePermission(session, 'sales.view')
  if (checked instanceof NextResponse) return checked

  try {
    const searchParams = request.nextUrl.searchParams
    const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined
    const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 100
    const sales = await listSales(checked.companyId, { from, to, limit })
    return NextResponse.json({ sales })
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  const checked = requirePermission(session, 'sales.create')
  if (checked instanceof NextResponse) return checked

  try {
    const body = await request.json()
    const parsed = saleSchema.safeParse(body)
    if (!parsed.success) return badRequest(parseError(parsed.error))

    const sale = await createSale({
      companyId: checked.companyId,
      userId: checked.userId,
      customerId: parsed.data.customerId,
      discount: parsed.data.discount,
      paymentMethod: parsed.data.paymentMethod,
      items: parsed.data.items,
    })

    await logAudit({
      userId: checked.userId,
      companyId: checked.companyId,
      action: 'CREATE_SALE',
      entity: 'SALE',
      entityId: sale.id,
      details: `Venta #${sale.number} por ${Number(sale.total).toFixed(2)}`,
    })

    return NextResponse.json({ sale }, { status: 201 })
  } catch (error) {
    return serverError(error)
  }
}

