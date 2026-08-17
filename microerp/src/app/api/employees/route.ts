import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { requirePermission, serverError, badRequest } from '@/lib/api-helpers'
import { createEmployee, updateEmployee, deleteEmployee, listEmployees, getEmployeeStats } from '@/services/employees.service'
import { employeeSchema, parseError } from '@/lib/validators'
import { logAudit } from '@/services/audit.service'

export async function GET(request: NextRequest) {
  const session = await getSession()
  const checked = requirePermission(session, 'employees.view')
  if (checked instanceof NextResponse) return checked

  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') ?? undefined

    if (searchParams.get('stats') === 'true') {
      const stats = await getEmployeeStats(searchParams.get('id')!, checked.companyId)
      return NextResponse.json({ stats })
    }

    const employees = await listEmployees(checked.companyId, search)
    return NextResponse.json({ employees })
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  const checked = requirePermission(session, 'employees.manage')
  if (checked instanceof NextResponse) return checked

  try {
    const body = await request.json()
    const parsed = employeeSchema.safeParse(body)
    if (!parsed.success) return badRequest(parseError(parsed.error))

    const employee = await createEmployee(checked.companyId, parsed.data)
    await logAudit({
      userId: checked.userId,
      companyId: checked.companyId,
      action: 'CREATE_EMPLOYEE',
      entity: 'EMPLOYEE',
      entityId: employee.id,
      details: `Empleado "${employee.name}" (${employee.position})`,
    })
    return NextResponse.json({ employee }, { status: 201 })
  } catch (error) {
    return serverError(error)
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  const checked = requirePermission(session, 'employees.manage')
  if (checked instanceof NextResponse) return checked

  try {
    const id = request.nextUrl.searchParams.get('id') ?? ''
    const body = await request.json()
    const parsed = employeeSchema.safeParse(body)
    if (!parsed.success) return badRequest(parseError(parsed.error))

    const employee = await updateEmployee(id, checked.companyId, parsed.data)
    await logAudit({
      userId: checked.userId,
      companyId: checked.companyId,
      action: 'UPDATE_EMPLOYEE',
      entity: 'EMPLOYEE',
      entityId: employee.id,
      details: `Empleado "${employee.name}" actualizado`,
    })
    return NextResponse.json({ employee })
  } catch (error) {
    return serverError(error)
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession()
  const checked = requirePermission(session, 'employees.manage')
  if (checked instanceof NextResponse) return checked

  try {
    const id = request.nextUrl.searchParams.get('id') ?? ''
    const result = await deleteEmployee(id, checked.companyId)
    await logAudit({
      userId: checked.userId,
      companyId: checked.companyId,
      action: 'DELETE_EMPLOYEE',
      entity: 'EMPLOYEE',
      entityId: id,
      details: 'Empleado desactivado',
    })
    return NextResponse.json(result)
  } catch (error) {
    return serverError(error)
  }
}