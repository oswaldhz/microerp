'use client'

import { useCallback, useEffect, useState } from 'react'
import { formatMoney } from '@/lib/utils'
import PageHeader from '@/components/PageHeader'

type Tab = 'sales' | 'profit' | 'inventory' | 'customers' | 'invoices'

const TABS: { id: Tab; label: string }[] = [
  { id: 'sales', label: 'Ventas' },
  { id: 'profit', label: 'Ganancias' },
  { id: 'inventory', label: 'Inventario' },
  { id: 'customers', label: 'Clientes' },
  { id: 'invoices', label: 'Cuentas por cobrar' },
]

const inputCls =
  'rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink outline-none transition focus:border-brand-leaf focus:ring-2 focus:ring-brand-mint'

const cardCls = 'rounded-xl border border-line bg-surface p-5 shadow-sm'

export default function ReportesPage() {
  const [tab, setTab] = useState<Tab>('sales')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [data, setData] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (t: Tab) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type: t })
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      const res = await fetch(`/api/reports?${params.toString()}`)
      const json = await res.json()
      if (json.report) setData(json.report)
    } catch {
      setData({})
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => {
    load(tab)
  }, [load, tab])

  const rows = (data as { products?: unknown[] }).products
  const sales = Array.isArray(data)
    ? (data as unknown as { name: string; total: number; count: number }[])
    : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes"
        description="Análisis de ventas, ganancias, inventario y cuentas por cobrar con filtro por fechas."
      >
        <div className="flex items-center gap-2">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
          <span className="text-sm text-muted">a</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
        </div>
      </PageHeader>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.id ? 'bg-brand-forest text-white shadow-sm' : 'bg-surface text-muted ring-1 ring-line-strong hover:bg-paper'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-muted">Cargando…</p>}

      {!loading && tab === 'sales' && (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-2 font-semibold">Concepto</th>
                <th className="px-4 py-2 text-right font-semibold">Unidades</th>
                <th className="px-4 py-2 text-right font-semibold">Total (RD$)</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.name} className="border-b border-line last:border-0 hover:bg-paper/70">
                  <td className="px-4 py-2 font-medium text-ink">{s.name}</td>
                  <td className="tnum px-4 py-2 text-right">{s.count}</td>
                  <td className="tnum px-4 py-2 text-right font-semibold">{formatMoney(s.total)}</td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-10 text-center text-sm text-muted">Sin datos en el rango seleccionado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === 'profit' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Ingresos', Number((data as { revenue?: number }).revenue ?? 0), 'text-brand-forest'],
            ['Costo de mercancía', Number((data as { costOfGoods?: number }).costOfGoods ?? 0), 'text-muted'],
            ['Gastos', Number((data as { expenses?: number }).expenses ?? 0), 'text-red-600'],
            ['Ganancia bruta', Number((data as { grossProfit?: number }).grossProfit ?? 0), 'text-brand-leaf'],
            ['Ganancia neta', Number((data as { netProfit?: number }).netProfit ?? 0), 'text-brand-forest'],
            ['Margen', `${Number((data as { margin?: number }).margin ?? 0)}%`, 'text-brand-leaf'],
          ].map(([label, value, cls]) => (
            <div key={String(label)} className={cardCls}>
              <p className="text-sm font-medium text-muted">{label}</p>
              <p className={`tnum mt-1 text-2xl font-bold ${cls}`}>{typeof value === 'number' ? formatMoney(value) : value}</p>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === 'inventory' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              ['Productos', (data as { totalProducts?: number }).totalProducts ?? 0],
              ['Unidades en stock', (data as { totalUnits?: number }).totalUnits ?? 0],
              ['Valor del inventario', formatMoney(Number((data as { totalValue?: number }).totalValue ?? 0))],
            ].map(([label, value]) => (
              <div key={String(label)} className={cardCls}>
                <p className="text-sm font-medium text-muted">{label}</p>
                <p className="tnum mt-1 text-2xl font-bold text-ink">{value}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-2 font-semibold">Producto</th>
                  <th className="px-4 py-2 font-semibold">Categoría</th>
                  <th className="px-4 py-2 text-right font-semibold">Stock</th>
                  <th className="px-4 py-2 text-right font-semibold">Valor (RD$)</th>
                </tr>
              </thead>
              <tbody>
                {(rows ?? []).map((p) => (
                  <tr key={String((p as { id: string }).id)} className="border-b border-line last:border-0 hover:bg-paper/70">
                    <td className="px-4 py-2 font-medium text-ink">{String((p as { name: string }).name)}</td>
                    <td className="px-4 py-2 text-muted">{String((p as { category: string }).category)}</td>
                    <td className="tnum px-4 py-2 text-right">{String((p as { stock: number }).stock)}</td>
                    <td className="tnum px-4 py-2 text-right font-semibold">{formatMoney(Number((p as { value: number }).value))}</td>
                  </tr>
                ))}
                {(rows ?? []).length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-muted">Sin productos en el rango seleccionado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && tab === 'customers' && (
        <div className="space-y-4">
          <div className={cardCls}>
            <p className="text-sm text-muted">Total de clientes: <strong className="text-ink">{Number((data as { total?: number }).total ?? 0)}</strong></p>
            <p className="mt-1 text-sm text-muted">Bronce: <strong className="text-ink">{Number((data as { byLevel?: Record<string, number> }).byLevel?.BRONCE ?? 0)}</strong> · Plata: <strong className="text-ink">{Number((data as { byLevel?: Record<string, number> }).byLevel?.PLATA ?? 0)}</strong> · Oro: <strong className="text-ink">{Number((data as { byLevel?: Record<string, number> }).byLevel?.ORO ?? 0)}</strong></p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-2 font-semibold">Cliente</th>
                  <th className="px-4 py-2 font-semibold">Nivel</th>
                  <th className="px-4 py-2 text-right font-semibold">Compras</th>
                  <th className="px-4 py-2 text-right font-semibold">Total (RD$)</th>
                </tr>
              </thead>
              <tbody>
                {((data as { top?: { id: string; name: string; level: string; purchases: number; total: number }[] }).top ?? []).map((c) => (
                  <tr key={c.id} className="border-b border-line last:border-0 hover:bg-paper/70">
                    <td className="px-4 py-2 font-medium text-ink">{c.name}</td>
                    <td className="px-4 py-2 text-muted">{c.level}</td>
                    <td className="tnum px-4 py-2 text-right">{c.purchases}</td>
                    <td className="tnum px-4 py-2 text-right font-semibold">{formatMoney(c.total)}</td>
                  </tr>
                ))}
                {((data as { top?: unknown[] }).top ?? []).length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-muted">Sin datos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && tab === 'invoices' && (
        <div className="space-y-4">
          <div className={cardCls}>
            <p className="text-sm text-muted">Facturas pendientes: <strong className="text-ink">{Number((data as { total?: number }).total ?? 0)}</strong> · Balance total: <strong className="text-amber-600">{formatMoney(Number((data as { totalBalance?: number }).totalBalance ?? 0))}</strong></p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-2 font-semibold">#</th>
                  <th className="px-4 py-2 font-semibold">Cliente</th>
                  <th className="px-4 py-2 text-right font-semibold">Total</th>
                  <th className="px-4 py-2 text-right font-semibold">Pagado</th>
                  <th className="px-4 py-2 text-right font-semibold">Balance</th>
                  <th className="px-4 py-2 text-right font-semibold">Días vencida</th>
                </tr>
              </thead>
              <tbody>
                {((data as { invoices?: { id: string; number: number; customer: string; total: number; paid: number; balance: number; daysOverdue: number }[] }).invoices ?? []).map((inv) => (
                  <tr key={inv.id} className="border-b border-line last:border-0 hover:bg-paper/70">
                    <td className="px-4 py-2 font-mono font-medium text-brand-forest">#{String(inv.number).padStart(4, '0')}</td>
                    <td className="px-4 py-2">{inv.customer}</td>
                    <td className="tnum px-4 py-2 text-right">{formatMoney(inv.total)}</td>
                    <td className="tnum px-4 py-2 text-right text-brand-forest">{formatMoney(inv.paid)}</td>
                    <td className="tnum px-4 py-2 text-right font-semibold text-amber-600">{formatMoney(inv.balance)}</td>
                    <td className={`tnum px-4 py-2 text-right font-medium ${inv.daysOverdue > 0 ? 'text-red-600' : 'text-muted'}`}>{inv.daysOverdue > 0 ? `${inv.daysOverdue} días` : '—'}</td>
                  </tr>
                ))}
                {((data as { invoices?: unknown[] }).invoices ?? []).length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">Sin facturas pendientes</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}