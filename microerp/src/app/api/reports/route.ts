import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { requirePermission, serverError } from '@/lib/api-helpers'
import { salesReport, profitReport, inventoryReport, customersReport, pendingInvoicesReport } from '@/services/reports.service'

export async function GET(request: NextRequest) {
  const session = await getSession()
  const checked = requirePermission(session, 'reports.view')
  if (checked instanceof NextResponse) return checked

  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') ?? 'sales'
    const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined
    const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined
    const filters = { from, to }

    switch (type) {
      case 'profit':
        return NextResponse.json({ report: await profitReport(checked.companyId, filters) })
      case 'inventory':
        return NextResponse.json({ report: await inventoryReport(checked.companyId) })
      case 'customers':
        return NextResponse.json({ report: await customersReport(checked.companyId) })
      case 'invoices':
        return NextResponse.json({ report: await pendingInvoicesReport(checked.companyId) })
      default:
        return NextResponse.json({ report: await salesReport(checked.companyId, filters) })
    }
  } catch (error) {
    return serverError(error)
  }
}