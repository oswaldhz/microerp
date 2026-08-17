import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { requirePermission, serverError, badRequest } from '@/lib/api-helpers'
import { createCategory, listCategories, deleteCategory } from '@/services/categories.service'
import { categorySchema, parseError } from '@/lib/validators'
import { logAudit } from '@/services/audit.service'

export async function GET() {
  const session = await getSession()
  const checked = requirePermission(session, 'inventory.view')
  if (checked instanceof NextResponse) return checked

  try {
    const categories = await listCategories(checked.companyId)
    return NextResponse.json({ categories })
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
    const parsed = categorySchema.safeParse(body)
    if (!parsed.success) return badRequest(parseError(parsed.error))

    const category = await createCategory(checked.companyId, parsed.data.name)
    await logAudit({
      userId: checked.userId,
      companyId: checked.companyId,
      action: 'CREATE_CATEGORY',
      entity: 'CATEGORY',
      entityId: category.id,
      details: `Categoría "${category.name}"`,
    })
    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    return serverError(error)
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession()
  const checked = requirePermission(session, 'inventory.manage')
  if (checked instanceof NextResponse) return checked

  try {
    const id = request.nextUrl.searchParams.get('id') ?? ''
    await deleteCategory(id, checked.companyId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return serverError(error)
  }
}