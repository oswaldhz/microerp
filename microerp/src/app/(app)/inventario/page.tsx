'use client'

import { useEffect, useMemo, useState } from 'react'
import { PackagePlus, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { formatMoney } from '@/lib/utils'
import PageHeader from '@/components/PageHeader'
import Tooltip from '@/components/Tooltip'

type Category = { id: string; name: string }
type Supplier = { id: string; name: string }
type Product = {
  id: string
  sku: string
  name: string
  description?: string
  categoryId?: string
  category?: { id: string; name: string }
  supplierId?: string
  supplier?: { id: string; name: string }
  purchasePrice: number | string
  salePrice: number | string
  stock: number | string
  minStock: number | string
}

const EMPTY: Omit<Product, 'id'> = {
  sku: '', name: '', description: '', categoryId: '', supplierId: '',
  purchasePrice: 0, salePrice: 0, stock: 0, minStock: 1,
}

const inputCls =
  'w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-brand-leaf focus:ring-2 focus:ring-brand-mint'

export default function InventarioPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'low'>('all')
  const [editing, setEditing] = useState<Product | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<Omit<Product, 'id'>>(EMPTY)
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [recommendation, setRecommendation] = useState<{ productId: string; avgDailySales: number; suggestedQty: number } | null>(null)

  async function load() {
    const [p, c, s] = await Promise.all([
      fetch('/api/products').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/suppliers').then((r) => r.json()),
    ])
    setProducts(p.products ?? [])
    setCategories(c.categories ?? [])
    setSuppliers(s.suppliers ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = products
    if (filter === 'low') list = list.filter((p) => Number(p.stock) <= Number(p.minStock))
    if (query) list = list.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase()))
    return list
  }, [products, query, filter])

  async function handleSave() {
    const url = creating ? '/api/products' : `/api/products?id=${editing?.id}`
    const method = creating ? 'POST' : 'PUT'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        categoryId: form.categoryId || null,
        supplierId: form.supplierId || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setMessage({ type: 'error', text: data.error ?? 'Error guardando producto' })
      return
    }
    setMessage({ type: 'ok', text: creating ? 'Producto creado' : 'Producto actualizado' })
    setCreating(false)
    setEditing(null)
    setForm(EMPTY)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este producto?')) return
    const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' })
    const data = await res.json()
    setMessage(data.error ? { type: 'error', text: data.error } : { type: 'ok', text: 'Producto eliminado' })
    load()
  }

  async function handleRecommend(productId: string) {
    const res = await fetch(`/api/products?filter=recommendation&productId=${productId}`)
    const data = await res.json()
    if (data.recommendation) {
      setRecommendation({ productId, ...data.recommendation })
      const product = products.find((p) => p.id === productId)
      if (product && data.recommendation.suggestedQty > 0) {
        setForm({ ...product, categoryId: product.categoryId ?? product.category?.id ?? '', supplierId: product.supplierId ?? product.supplier?.id ?? '' })
        setEditing(product)
        setCreating(false)
      }
    }
  }

  function openCreate() {
    setCreating(true)
    setEditing(null)
    setForm(EMPTY)
    setRecommendation(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario"
        description="Productos, precios, existencias y stock mínimo para reposición."
      >
        <Tooltip label="Registra un nuevo producto con su precio de compra y venta">
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-brand-forest px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-ink"
          >
            <Plus size={16} /> Nuevo producto
          </button>
        </Tooltip>
      </PageHeader>

      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${message.type === 'ok' ? 'bg-brand-mint text-brand-forest' : 'bg-red-50 text-red-600'}`}>
          {message.text}
        </div>
      )}

      {(creating || editing) && (
        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-ink">
            {creating ? 'Nuevo producto' : `Editar: ${editing?.name}`}
          </h2>
          {recommendation && recommendation.productId === editing?.id && (
            <p className="mb-4 rounded-lg bg-brand-mint px-3 py-2 text-sm text-brand-forest">
              Sugerencia de compra: venta promedio de {recommendation.avgDailySales.toFixed(2)} uds/día → sugiere reponer {recommendation.suggestedQty} unidades.
            </p>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input placeholder="SKU *" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={inputCls} />
            <input placeholder="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
            <input placeholder="Descripción" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} />
            <select value={form.categoryId ?? ''} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className={inputCls}>
              <option value="">Categoría</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={form.supplierId ?? ''} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className={inputCls}>
              <option value="">Proveedor</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input type="number" min={0} placeholder="Precio compra *" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: Number(e.target.value) })} className={inputCls} />
            <input type="number" min={0} placeholder="Precio venta *" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: Number(e.target.value) })} className={inputCls} />
            <input type="number" min={0} placeholder="Stock *" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className={inputCls} />
            <input type="number" min={0} placeholder="Stock mínimo *" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} className={inputCls} />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleSave} className="rounded-lg bg-brand-forest px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-ink">Guardar</button>
            <button onClick={() => { setCreating(false); setEditing(null); setForm(EMPTY); setRecommendation(null) }} className="rounded-lg border border-line-strong px-4 py-2 text-sm font-medium text-muted transition hover:bg-paper">Cancelar</button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-line-strong bg-surface px-3 shadow-sm">
          <Search size={16} className="text-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar…" className="bg-transparent py-2 text-sm outline-none placeholder:text-muted/60" />
        </div>
        <div className="flex overflow-hidden rounded-lg border border-line-strong">
          {(['all', 'low'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-sm font-medium transition ${filter === f ? 'bg-brand-forest text-white' : 'bg-surface text-muted hover:bg-paper'}`}
            >
              {f === 'all' ? 'Todos' : 'Stock bajo'}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-2 font-semibold">SKU</th>
              <th className="px-4 py-2 font-semibold">Producto</th>
              <th className="px-4 py-2 font-semibold">Categoría</th>
              <th className="px-4 py-2 font-semibold">Proveedor</th>
              <th className="px-4 py-2 text-right font-semibold">Compra</th>
              <th className="px-4 py-2 text-right font-semibold">Venta</th>
              <th className="px-4 py-2 text-right font-semibold">Stock</th>
              <th className="px-4 py-2 text-right font-semibold">Mínimo</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0 hover:bg-paper/70">
                <td className="px-4 py-2 font-mono text-xs text-muted">{p.sku}</td>
                <td className="px-4 py-2 font-medium text-ink">{p.name}</td>
                <td className="px-4 py-2 text-muted">{p.category?.name ?? '—'}</td>
                <td className="px-4 py-2 text-muted">{p.supplier?.name ?? '—'}</td>
                <td className="tnum px-4 py-2 text-right">{formatMoney(Number(p.purchasePrice))}</td>
                <td className="tnum px-4 py-2 text-right font-semibold">{formatMoney(Number(p.salePrice))}</td>
                <td className={`tnum px-4 py-2 text-right font-semibold ${Number(p.stock) <= Number(p.minStock) ? 'text-red-600' : 'text-ink'}`}>{Number(p.stock)}</td>
                <td className="tnum px-4 py-2 text-right text-muted">{Number(p.minStock)}</td>
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-1">
                    <Tooltip label="Sugerir compra según ventas">
                      <button onClick={() => handleRecommend(p.id)} className="rounded p-1.5 text-brand-leaf transition hover:bg-brand-mint"><RefreshCw size={15} /></button>
                    </Tooltip>
                    <Tooltip label="Editar">
                      <button onClick={() => { setEditing(p); setCreating(false); setForm({ ...p, categoryId: p.categoryId ?? p.category?.id ?? '', supplierId: p.supplierId ?? p.supplier?.id ?? '' }) }} className="rounded p-1.5 text-muted transition hover:bg-brand-mint hover:text-brand-forest"><Pencil size={15} /></button>
                    </Tooltip>
                    <Tooltip label="Eliminar">
                      <button onClick={() => handleDelete(p.id)} className="rounded p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                    </Tooltip>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-mint text-brand-leaf">
                      <PackagePlus size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {query ? 'Sin resultados para tu búsqueda' : 'Tu inventario está vacío'}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {query ? 'Prueba con otro término.' : 'Registra el primer producto para empezar a vender.'}
                      </p>
                    </div>
                    {!query && (
                      <button
                        onClick={openCreate}
                        className="mt-1 flex items-center gap-1.5 rounded-lg bg-brand-mint px-3 py-1.5 text-xs font-semibold text-brand-forest transition hover:bg-brand-mint-strong"
                      >
                        <Plus size={14} /> Añadir producto
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-ink">Categorías</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <span key={c.id} className="rounded-full bg-brand-mint px-3 py-1 text-xs font-medium text-brand-forest">{c.name}</span>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <input
            id="new-category"
            placeholder="Nueva categoría…"
            className={inputCls + ' max-w-64'}
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                const res = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: (e.target as HTMLInputElement).value }) })
                const data = await res.json()
                setMessage(data.error ? { type: 'error', text: data.error } : { type: 'ok', text: 'Categoría creada' })
                ;(e.target as HTMLInputElement).value = ''
                load()
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}