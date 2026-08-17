import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { requirePermission, serverError, badRequest } from '@/lib/api-helpers'
import { createExpense, updateExpense, deleteExpense, listExpenses, expenseCategories } from '@/services/expenses.service'
import { expenseSchema, parseError } from '@/lib/validators'
import { logAudit } from '@/services/audit.service'

export async function GET(request: NextRequest) {
  const session = await getSession()
  const checked = requirePermission(session, 'expenses.view')
  if (checked instanceof NextResponse) return checked

  try {
    const searchParams = request.nextUrl.searchParams
    if (searchParams.get('categories') === 'true') {
      const categories = await expenseCategories(checked.companyId)
      return NextResponse.json({ categories })
    }

    const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined
    const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined
    const expenses = await listExpenses(checked.companyId, { from, to })
    return NextResponse.json({ expenses })
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  const checked = requirePermission(session, 'expenses.manage')
  if (checked instanceof NextResponse) return checked

  try {
    const body = await request.json()
    const parsed = expenseSchema.safeParse(body)
    if (!parsed.success) return badRequest(parseError(parsed.error))

    const expense = await createExpense(checked.companyId, parsed.data)
    await logAudit({
      userId: checked.userId,
      companyId: checked.companyId,
      action: 'CREATE_EXPENSE',
      entity: 'EXPENSE',
      entityId: expense.id,
      details: `Gasto "${expense.description}" por ${Number(expense.amount).toFixed(2)}`,
    })
    return NextResponse.json({ expense }, { status: 201 })
  } catch (error) {
    return serverError(error)
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  const checked = requirePermission(session, 'expenses.manage')
  if (checked instanceof NextResponse) return checked

  try {
    const id = request.nextUrl.searchParams.get('id') ?? ''
    const body = await request.json()
    const parsed = expenseSchema.safeParse(body)
    if (!parsed.success) return badRequest(parseError(parsed.error))

    const expense = await updateExpense(id, checked.companyId, parsed.data)
    await logAudit({
      userId: checked.userId,
      companyId: checked.companyId,
      action: 'UPDATE_EXPENSE',
      entity: 'EXPENSE',
      entityId: expense.id,
      details: `Gasto "${expense.description}" actualizado`,
    })
    return NextResponse.json({ expense })
  } catch (error) {
    return serverError(error)
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession()
  const checked = requirePermission(session, 'expenses.manage')
  if (checked instanceof NextResponse) return checked

  try {
    const id = request.nextUrl.searchParams.get('id') ?? ''
    const result = await deleteExpense(id, checked.companyId)
    await logAudit({
      userId: checked.userId,
      companyId: checked.companyId,
      action: 'DELETE_EXPENSE',
      entity: 'EXPENSE',
      entityId: id,
      details: 'Gasto eliminado',
    })
    return NextResponse.json(result)
  } catch (error) {
    return serverError(error)
  }
}