'use client'

import { useEffect, useMemo, useState } from 'react'
import { Minus, Plus, ReceiptText, Search, ShoppingCart, Trash2 } from 'lucide-react'
import { computeTotals, formatMoney } from '@/lib/utils'
import PageHeader from '@/components/PageHeader'
import Tooltip from '@/components/Tooltip'

type Product = {
  id: string
  sku: string
  name: string
  salePrice: number | string
  stock: number | string
  category?: { name: string }
}

type Customer = { id: string; name: string }

type CartItem = { productId: string; name: string; price: number; qty: number; stock: number }

type Sale = {
  id: string
  number: number
  total: number | string
  status: string
  createdAt: string
  customer?: { name: string } | null
  items: { productId: string; quantity: number }[]
}

const PAYMENT_METHODS = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA']

const inputCls =
  'w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink outline-none transition focus:border-brand-leaf focus:ring-2 focus:ring-brand-mint'

export default function VentasPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerId, setCustomerId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO')
  const [discount, setDiscount] = useState(0)
  const [query, setQuery] = useState('')
  const [sales, setSales] = useState<Sale[]>([])
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then((r) => r.json()),
      fetch('/api/customers').then((r) => r.json()),
      fetch('/api/sales').then((r) => r.json()),
    ])
      .then(([p, c, s]) => {
        setProducts(p.products ?? [])
        setCustomers(c.customers ?? [])
        setSales(s.sales ?? [])
      })
      .catch(() => setMessage({ type: 'error', text: 'Error cargando datos' }))
  }, [])

  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase())),
    [products, query],
  )

  const totals = useMemo(
    () => computeTotals(cart.reduce((acc, i) => acc + i.price * i.qty, 0), discount),
    [cart, discount],
  )

  function addToCart(product: Product) {
    const price = Number(product.salePrice)
    const stock = Number(product.stock)
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        if (existing.qty + 1 > stock) return prev
        return prev.map((i) => (i.productId === product.id ? { ...i, qty: i.qty + 1 } : i))
      }
      return [...prev, { productId: product.id, name: product.name, price, qty: 1, stock }]
    })
  }

  function changeQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, qty: Math.min(i.qty + delta, i.stock) } : i))
        .filter((i) => i.qty > 0),
    )
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((i) => i.productId !== productId))
  }

  async function checkout() {
    if (cart.length === 0) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId || null,
          items: cart.map((i) => ({ productId: i.productId, quantity: i.qty })),
          paymentMethod,
          discount,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error ?? 'Error al procesar la venta' })
        return
      }
      const ticket = String(data.sale?.number ?? '').padStart(4, '0')
      setMessage({ type: 'ok', text: `Ticket #${ticket} — venta registrada por ${formatMoney(data.sale?.total ?? 0)}` })
      setCart([])
      setDiscount(0)
      const [p, s] = await Promise.all([fetch('/api/products').then((r) => r.json()), fetch('/api/sales').then((r) => r.json())])
      setProducts(p.products ?? [])
      setSales(s.sales ?? [])
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión' })
    } finally {
      setLoading(false)
    }
  }

  async function refundSale(saleId: string) {
    if (!confirm('¿Devolver esta venta? Se repondrá el inventario.')) return
    const res = await fetch(`/api/sales/${saleId}/refund`, { method: 'POST' })
    const data = await res.json()
    setMessage(data.error ? { type: 'error', text: data.error } : { type: 'ok', text: 'Venta devuelta correctamente' })
    const [p, s] = await Promise.all([fetch('/api/products').then((r) => r.json()), fetch('/api/sales').then((r) => r.json())])
    setProducts(p.products ?? [])
    setSales(s.sales ?? [])
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Punto de Venta"
        description="Registra ventas del mostrador, aplica descuentos y devuelve ventas del historial."
      />

      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${message.type === 'ok' ? 'bg-brand-mint text-brand-forest' : 'bg-red-50 text-red-600'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Catálogo */}
        <div className="lg:col-span-3">
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-line-strong bg-surface px-3 shadow-sm">
            <Search size={16} className="shrink-0 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar producto por nombre o SKU…"
              className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted/60"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={Number(p.stock) <= 0}
                className={`rounded-xl border bg-surface p-4 text-left shadow-sm transition ${
                  Number(p.stock) <= 0 ? 'cursor-not-allowed opacity-50' : 'hover:border-brand-leaf hover:shadow-md'
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-mono text-xs text-muted">{p.sku}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${Number(p.stock) > 0 ? 'bg-brand-mint text-brand-forest' : 'bg-red-50 text-red-600'}`}>
                    {Number(p.stock)} uds
                  </span>
                </div>
                <p className="font-semibold text-ink">{p.name}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="tnum text-sm font-bold text-brand-forest">{formatMoney(Number(p.salePrice))}</span>
                  <Plus size={16} className="text-brand-leaf" />
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full rounded-xl border border-dashed border-line-strong py-10 text-center text-sm text-muted">
                {query ? 'Sin resultados para tu búsqueda.' : 'No hay productos aún — créalos en Inventario.'}
              </p>
            )}
          </div>
        </div>

        {/* Carrito — ticket */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
            <div className="flex items-center gap-2 border-b border-line bg-brand-ink px-4 py-3 text-white">
              <ShoppingCart size={18} className="text-brand-mint" />
              <h2 className="text-sm font-semibold">Carrito ({cart.length})</h2>
            </div>

            <div className="max-h-64 overflow-y-auto px-4 py-2">
              {cart.length === 0 && (
                <p className="py-6 text-center text-sm text-muted">Agrega productos para iniciar la venta</p>
              )}
              {cart.map((i) => (
                <div key={i.productId} className="flex items-center justify-between border-b border-dashed border-line py-2.5 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{i.name}</p>
                    <p className="tnum text-xs text-muted">{formatMoney(i.price)} c/u</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => changeQty(i.productId, -1)} className="rounded p-1 text-muted transition hover:bg-brand-mint hover:text-brand-forest"><Minus size={14} /></button>
                    <span className="tnum w-6 text-center text-sm font-semibold">{i.qty}</span>
                    <button onClick={() => changeQty(i.productId, 1)} className="rounded p-1 text-muted transition hover:bg-brand-mint hover:text-brand-forest"><Plus size={14} /></button>
                    <button onClick={() => removeFromCart(i.productId)} className="rounded p-1 text-red-400 transition hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 border-t border-line px-4 py-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Cliente</label>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={inputCls}>
                  <option value="">Cliente mostrador (sin registro)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Método de pago</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputCls}>
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Descuento (RD$)</label>
                  <input
                    type="number"
                    min={0}
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Ticket de totales */}
              <div className="receipt-edge rounded-lg border border-line bg-paper px-4 py-3">
                <div className="mb-2 flex items-center justify-center gap-1.5 border-b border-dashed border-line-strong pb-2">
                  <ReceiptText size={14} className="text-muted" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                    Total a cobrar
                  </span>
                </div>
                <dl className="tnum space-y-1 text-sm">
                  <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="font-medium text-ink">{formatMoney(totals.subtotal)}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Descuento</dt><dd className="font-medium text-red-500">-{formatMoney(totals.discount)}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">ITBIS (18%)</dt><dd className="font-medium text-ink">{formatMoney(totals.tax)}</dd></div>
                  <div className="flex justify-between border-t border-dashed border-line-strong pt-2 text-base">
                    <dt className="font-semibold text-ink">TOTAL</dt>
                    <dd className="font-bold text-brand-forest">{formatMoney(totals.total)}</dd>
                  </div>
                </dl>
              </div>

              <Tooltip label="Registra la venta y descuenta el inventario">
                <button
                  onClick={checkout}
                  disabled={cart.length === 0 || loading}
                  className="w-full rounded-lg bg-brand-forest py-2.5 text-sm font-semibold text-white transition hover:bg-brand-ink disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? 'Procesando…' : 'Completar venta'}
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Ventas recientes */}
      <div className="rounded-xl border border-line bg-surface shadow-sm">
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">Ventas recientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-2 font-semibold">Ticket</th>
                <th className="px-4 py-2 font-semibold">Cliente</th>
                <th className="px-4 py-2 font-semibold">Método</th>
                <th className="px-4 py-2 font-semibold">Fecha</th>
                <th className="px-4 py-2 text-right font-semibold">Total</th>
                <th className="px-4 py-2 font-semibold">Estado</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {sales.slice(0, 10).map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0 hover:bg-paper/70">
                  <td className="px-4 py-2 font-mono font-medium text-brand-forest">
                    #{String(s.number).padStart(4, '0')}
                  </td>
                  <td className="px-4 py-2">{s.customer?.name ?? 'Mostrador'}</td>
                  <td className="px-4 py-2 text-muted">{(s as unknown as { paymentMethod?: string }).paymentMethod ?? '—'}</td>
                  <td className="px-4 py-2 text-muted">{new Date(s.createdAt).toLocaleDateString('es-DO')}</td>
                  <td className="tnum px-4 py-2 text-right font-semibold">{formatMoney(Number(s.total))}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.status === 'COMPLETADA' ? 'bg-brand-mint text-brand-forest' : 'bg-red-50 text-red-600'}`}>
                      {s.status === 'COMPLETADA' ? 'Completada' : 'Devuelta'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {s.status === 'COMPLETADA' && (
                      <button onClick={() => refundSale(s.id)} className="text-xs font-medium text-red-500 transition hover:text-red-600">
                        Devolver
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted">
                    Aún no hay ventas — la primera se imprimirá aquí como ticket #0001.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}