'use client'

import { useEffect, useState } from 'react'
import { Ban, ClipboardList, PackageCheck, Plus } from 'lucide-react'
import { formatMoney } from '@/lib/utils'
import PageHeader from '@/components/PageHeader'
import Tooltip from '@/components/Tooltip'

type Supplier = { id: string; name: string }
type Product = { id: string; name: string; sku: string; purchasePrice: number | string }
type Order = {
  id: string
  number: number
  supplier?: { name: string } | null
  status: string
  total: number | string
  createdAt: string
  items?: { id: string; product?: { name: string } | null; quantity: number; unitPrice: number | string }[]
}

const STATUS: Record<string, { label: string; cls: string }> = {
  PENDIENTE: { label: 'Pendiente', cls: 'bg-amber-50 text-amber-700' },
  RECIBIDA: { label: 'Recibida', cls: 'bg-brand-mint text-brand-forest' },
  CANCELADA: { label: 'Cancelada', cls: 'bg-red-50 text-red-600' },
}

const inputCls =
  'w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink outline-none transition focus:border-brand-leaf focus:ring-2 focus:ring-brand-mint'

export default function ComprasPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [creating, setCreating] = useState(false)
  const [supplierId, setSupplierId] = useState('')
  const [lines, setLines] = useState<{ productId: string; quantity: number }[]>([{ productId: '', quantity: 1 }])
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  async function load() {
    const [o, s, p] = await Promise.all([
      fetch('/api/purchase-orders').then((r) => r.json()),
      fetch('/api/suppliers').then((r) => r.json()),
      fetch('/api/products').then((r) => r.json()),
    ])
    setOrders(o.orders ?? [])
    setSuppliers(s.suppliers ?? [])
    setProducts(p.products ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate() {
    const res = await fetch('/api/purchase-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supplierId,
        items: lines.filter((l) => l.productId),
      }),
    })
    const data = await res.json()
    setMessage(data.error ? { type: 'error', text: data.error } : { type: 'ok', text: `Orden de compra #${data.order?.number} creada` })
    setCreating(false)
    setSupplierId('')
    setLines([{ productId: '', quantity: 1 }])
    load()
  }

  async function handleAction(order: Order, action: 'receive' | 'cancel') {
    if (action === 'cancel' && !confirm(`¿Cancelar la orden #${order.number}?`)) return
    if (action === 'receive' && !confirm(`¿Marcar la orden #${order.number} como recibida? Se actualizará el stock.`)) return
    const res = await fetch(`/api/purchase-orders/${order.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const data = await res.json()
    setMessage(data.error ? { type: 'error', text: data.error } : { type: 'ok', text: action === 'receive' ? 'Orden recibida, stock actualizado' : 'Orden cancelada' })
    load()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Órdenes de compra"
        description="Crea órdenes a proveedores y, al recibir la mercancía, el stock se actualiza solo."
      >
        <Tooltip label="Crea una orden de compra a un proveedor">
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 rounded-lg bg-brand-forest px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-ink"
          >
            <Plus size={16} /> Nueva orden
          </button>
        </Tooltip>
      </PageHeader>

      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${message.type === 'ok' ? 'bg-brand-mint text-brand-forest' : 'bg-red-50 text-red-600'}`}>
          {message.text}
        </div>
      )}

      {creating && (
        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-ink">Nueva orden de compra</h2>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className={`${inputCls} mb-3 sm:w-72`}
          >
            <option value="">Proveedor *</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <div className="space-y-2">
            {lines.map((line, idx) => (
              <div key={idx} className="flex flex-wrap gap-2">
                <select
                  value={line.productId}
                  onChange={(e) => setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, productId: e.target.value } : l)))}
                  className={`${inputCls} min-w-56 flex-1`}
                >
                  <option value="">Producto…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({formatMoney(Number(p.purchasePrice))})</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) => setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, quantity: Math.max(1, Number(e.target.value)) } : l)))}
                  className={`${inputCls} w-24`}
                />
                <button
                  onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                  disabled={lines.length === 1}
                  className="rounded-lg px-3 text-sm text-red-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                >
                  Quitar
                </button>
              </div>
            ))}
            <button
              onClick={() => setLines((prev) => [...prev, { productId: '', quantity: 1 }])}
              className="text-sm font-medium text-brand-leaf transition hover:text-brand-forest"
            >
              + Agregar línea
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={handleCreate} className="rounded-lg bg-brand-forest px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-ink">Crear orden</button>
            <button onClick={() => setCreating(false)} className="rounded-lg border border-line-strong px-4 py-2 text-sm font-medium text-muted transition hover:bg-paper">Cancelar</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {orders.map((order) => {
          const st = STATUS[order.status] ?? { label: order.status, cls: 'bg-zinc-100 text-zinc-600' }
          return (
            <div key={order.id} className="rounded-xl border border-line bg-surface p-5 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-sm font-semibold text-brand-forest">Orden #{String(order.number).padStart(4, '0')}</span>
                  <span className="ml-2 text-sm text-muted">{order.supplier?.name ?? '—'}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>{st.label}</span>
                  <span className="tnum text-sm font-bold text-ink">{formatMoney(Number(order.total))}</span>
                  <span className="text-xs text-muted">{new Date(order.createdAt).toLocaleDateString('es-DO')}</span>
                  {order.status === 'PENDIENTE' && (
                    <div className="flex gap-2">
                      <Tooltip label="Actualiza el stock con la mercancía recibida">
                        <button onClick={() => handleAction(order, 'receive')} className="flex items-center gap-1 rounded-lg bg-brand-forest px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-ink">
                          <PackageCheck size={14} /> Recibir
                        </button>
                      </Tooltip>
                      <button onClick={() => handleAction(order, 'cancel')} className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50">
                        <Ban size={14} /> Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {order.items && order.items.length > 0 && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                      <th className="py-1.5 font-semibold">Producto</th>
                      <th className="py-1.5 text-right font-semibold">Cantidad</th>
                      <th className="py-1.5 text-right font-semibold">Precio unitario</th>
                      <th className="py-1.5 text-right font-semibold">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id} className="border-b border-line last:border-0">
                        <td className="py-1.5">{item.product?.name ?? '—'}</td>
                        <td className="tnum py-1.5 text-right">{item.quantity}</td>
                        <td className="tnum py-1.5 text-right">{formatMoney(Number(item.unitPrice))}</td>
                        <td className="tnum py-1.5 text-right font-medium">{formatMoney(Number(item.unitPrice) * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )
        })}
        {orders.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line-strong py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-mint text-brand-leaf">
              <ClipboardList size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Sin órdenes de compra</p>
              <p className="mt-0.5 text-xs text-muted">Crea una orden a un proveedor para reponer inventario.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}