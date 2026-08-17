import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { requirePermission, serverError, badRequest } from '@/lib/api-helpers'
import { createEmployee, updateEmployee, deleteEmployee, listEmployees, getEmployeeStats, createLoginUser, updateLoginUser, setEmployeeStatus } from '@/services/employees.service'
import { hashPassword } from '@/services/auth.service'
import { employeeSchema, employeeStatusSchema, parseError } from '@/lib/validators'
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

    const { password, ...employeeData } = parsed.data
    if (password) {
      if (!employeeData.email) {
        return badRequest('Para dar acceso por correo, el empleado debe tener un correo')
      }
      await createLoginUser({
        companyId: checked.companyId,
        name: employeeData.name,
        email: employeeData.email,
        passwordHash: await hashPassword(password),
      })
    }

    const employee = await createEmployee(checked.companyId, employeeData)
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

    const { password, ...employeeData } = parsed.data
    if (password) {
      if (!employeeData.email) {
        return badRequest('Para cambiar la contraseña el empleado debe tener un correo')
      }
      await updateLoginUser({
        companyId: checked.companyId,
        name: employeeData.name,
        email: employeeData.email,
        passwordHash: await hashPassword(password),
      })
    }

    const employee = await updateEmployee(id, checked.companyId, employeeData)
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

export async function PATCH(request: NextRequest) {
  const session = await getSession()
  const checked = requirePermission(session, 'employees.manage')
  if (checked instanceof NextResponse) return checked

  try {
    const id = request.nextUrl.searchParams.get('id') ?? ''
    const body = await request.json()
    const parsed = employeeStatusSchema.safeParse(body)
    if (!parsed.success) return badRequest(parseError(parsed.error))

    const employee = await setEmployeeStatus(id, checked.companyId, parsed.data.active, checked.userId)
    await logAudit({
      userId: checked.userId,
      companyId: checked.companyId,
      action: parsed.data.active ? 'ENABLE_EMPLOYEE' : 'DISABLE_EMPLOYEE',
      entity: 'EMPLOYEE',
      entityId: employee.id,
      details: `Empleado "${employee.name}" ${parsed.data.active ? 'dado de alta' : 'dado de baja'}`,
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