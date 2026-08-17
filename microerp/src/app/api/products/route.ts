import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { requirePermission, serverError, badRequest } from '@/lib/api-helpers'
import { createProduct, updateProduct, deleteProduct, listProducts, lowStockProducts, getPurchaseRecommendation } from '@/services/products.service'
import { productSchema, recommendationSchema, parseError } from '@/lib/validators'
import { logAudit } from '@/services/audit.service'

export async function GET(request: NextRequest) {
  const session = await getSession()
  const checked = requirePermission(session, 'inventory.view')
  if (checked instanceof NextResponse) return checked

  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') ?? undefined
    const filter = searchParams.get('filter')

    if (filter === 'low') {
      const products = await lowStockProducts(checked.companyId)
      return NextResponse.json({ products })
    }
    if (filter === 'recommendation' && searchParams.get('productId')) {
      const parsed = recommendationSchema.safeParse({
        productId: searchParams.get('productId'),
        days: searchParams.get('days') ?? 30,
      })
      if (!parsed.success) return badRequest(parseError(parsed.error))
      const recommendation = await getPurchaseRecommendation({
        productId: parsed.data.productId,
        companyId: checked.companyId,
        days: parsed.data.days,
      })
      return NextResponse.json({ recommendation })
    }

    const products = await listProducts(checked.companyId, search)
    return NextResponse.json({ products })
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
    const parsed = productSchema.safeParse(body)
    if (!parsed.success) return badRequest(parseError(parsed.error))

    const product = await createProduct(checked.companyId, parsed.data)
    await logAudit({
      userId: checked.userId,
      companyId: checked.companyId,
      action: 'CREATE_PRODUCT',
      entity: 'PRODUCT',
      entityId: product.id,
      details: `Producto "${product.name}" (${product.sku})`,
    })
    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    return serverError(error)
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  const checked = requirePermission(session, 'inventory.manage')
  if (checked instanceof NextResponse) return checked

  try {
    const id = request.nextUrl.searchParams.get('id') ?? ''
    const body = await request.json()
    const parsed = productSchema.safeParse(body)
    if (!parsed.success) return badRequest(parseError(parsed.error))

    const product = await updateProduct(id, checked.companyId, parsed.data)
    await logAudit({
      userId: checked.userId,
      companyId: checked.companyId,
      action: 'UPDATE_PRODUCT',
      entity: 'PRODUCT',
      entityId: product.id,
      details: `Producto "${product.name}" actualizado`,
    })
    return NextResponse.json({ product })
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
    const result = await deleteProduct(id, checked.companyId)
    await logAudit({
      userId: checked.userId,
      companyId: checked.companyId,
      action: 'DELETE_PRODUCT',
      entity: 'PRODUCT',
      entityId: id,
      details: 'Producto eliminado',
    })
    return NextResponse.json(result)
  } catch (error) {
    return serverError(error)
  }
}