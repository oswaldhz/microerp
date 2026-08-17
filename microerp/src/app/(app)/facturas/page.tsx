'use client'

import { useCallback, useEffect, useState } from 'react'
import { Ban, CheckCircle2, FilePlus2, Plus, Search } from 'lucide-react'
import { formatMoney } from '@/lib/utils'
import PageHeader from '@/components/PageHeader'
import Tooltip from '@/components/Tooltip'
import { useConfirm } from '@/components/ConfirmProvider'
import { useToast } from '@/components/ToastProvider'

type Customer = { id: string; name: string }
type Invoice = {
  id: string
  number: number
  customer?: { name: string } | null
  subtotal: number | string
  tax: number | string
  total: number | string
  status: string
  issueDate: string
  dueDate: string
  payments?: { id: string; amount: number | string; method: string }[]
}

const STATUS: Record<string, { label: string; cls: string }> = {
  PENDIENTE: { label: 'Pendiente', cls: 'bg-amber-50 text-amber-700' },
  PAGADA: { label: 'Pagada', cls: 'bg-brand-mint text-brand-forest' },
  CANCELADA: { label: 'Cancelada', cls: 'bg-red-50 text-red-600' },
}

const inputCls =
  'w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink outline-none transition focus:border-brand-leaf focus:ring-2 focus:ring-brand-mint'

export default function FacturasPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [creating, setCreating] = useState(false)
  const [paying, setPaying] = useState<Invoice | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('TRANSFERENCIA')
  const [form, setForm] = useState({ customerId: '', subtotal: 0 })

  const confirmDialog = useConfirm()
  const toast = useToast()

  const load = useCallback(async () => {
    const url = statusFilter ? `/api/invoices?status=${statusFilter}` : '/api/invoices'
    const [inv, cust] = await Promise.all([fetch(url).then((r) => r.json()), fetch('/api/customers').then((r) => r.json())])
    setInvoices(inv.invoices ?? [])
    setCustomers(cust.customers ?? [])
  }, [statusFilter])

  useEffect(() => {
    load()
  }, [load])

  function paidAmount(inv: Invoice) {
    return (inv.payments ?? []).reduce((acc, p) => acc + Number(p.amount), 0)
  }

  function balance(inv: Invoice) {
    return Math.max(0, Number(inv.total) - paidAmount(inv))
  }

  async function handleCreate() {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    data.error ? toast.error(data.error) : toast.success(`Factura #${data.invoice?.number} creada`)
    setCreating(false)
    setForm({ customerId: '', subtotal: 0 })
    load()
  }

  async function handlePay(inv: Invoice) {
    const res = await fetch(`/api/invoices/${inv.id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(payAmount), method: payMethod }),
    })
    const data = await res.json()
    data.error ? toast.error(data.error) : toast.success('Pago registrado')
    setPaying(null)
    setPayAmount('')
    load()
  }

  async function handleCancel(inv: Invoice) {
    if (!(await confirmDialog({ title: 'Cancelar factura', message: `¿Cancelar la factura #${inv.number}?`, confirmLabel: 'Cancelar', danger: true }))) return
    const res = await fetch(`/api/invoices?id=${inv.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.error) {
      toast.error(data.error)
    } else {
      toast.success('Factura cancelada')
    }
    load()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facturación"
        description="Factura a clientes, registra pagos parciales y controla los saldos por cobrar."
      >
        <Tooltip label="Crea una factura a crédito para un cliente">
          <button
            onClick={() => { setCreating(true) }}
            className="flex items-center gap-2 rounded-lg bg-brand-forest px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-ink"
          >
            <Plus size={16} /> Nueva factura
          </button>
        </Tooltip>
      </PageHeader>

      {creating && (
        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-ink">Nueva factura</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              className={inputCls}
            >
              <option value="">Cliente *</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input
              type="number"
              min={0}
              value={form.subtotal}
              onChange={(e) => setForm({ ...form, subtotal: Number(e.target.value) })}
              placeholder="Monto a facturar (RD$) *"
              className={inputCls}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleCreate} className="rounded-lg bg-brand-forest px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-ink">Crear factura</button>
            <button onClick={() => setCreating(false)} className="rounded-lg border border-line-strong px-4 py-2 text-sm font-medium text-muted transition hover:bg-paper">Cancelar</button>
          </div>
        </div>
      )}

      {paying && (
        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-ink">Registrar pago — Factura #{paying.number}</h2>
          <p className="mb-4 text-sm text-muted">Balance pendiente: <strong className="text-ink">{formatMoney(balance(paying))}</strong></p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="number"
              min={0}
              max={balance(paying)}
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="Monto a pagar"
              className={inputCls}
            />
            <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className={inputCls}>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TARJETA">Tarjeta</option>
            </select>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => handlePay(paying)} className="rounded-lg bg-brand-forest px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-ink">Registrar pago</button>
            <button onClick={() => setPaying(null)} className="rounded-lg border border-line-strong px-4 py-2 text-sm font-medium text-muted transition hover:bg-paper">Cancelar</button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Search size={16} className="text-muted" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls + ' w-auto'}>
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendientes</option>
          <option value="PAGADA">Pagadas</option>
          <option value="CANCELADA">Canceladas</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-2 font-semibold">#</th>
              <th className="px-4 py-2 font-semibold">Cliente</th>
              <th className="px-4 py-2 text-right font-semibold">Subtotal</th>
              <th className="px-4 py-2 text-right font-semibold">ITBIS</th>
              <th className="px-4 py-2 text-right font-semibold">Total</th>
              <th className="px-4 py-2 text-right font-semibold">Pagado</th>
              <th className="px-4 py-2 text-right font-semibold">Balance</th>
              <th className="px-4 py-2 font-semibold">Vence</th>
              <th className="px-4 py-2 font-semibold">Estado</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const st = STATUS[inv.status] ?? { label: inv.status, cls: 'bg-zinc-100 text-zinc-600' }
              const bal = balance(inv)
              return (
                <tr key={inv.id} className="border-b border-line last:border-0 hover:bg-paper/70">
                  <td className="px-4 py-2 font-mono font-medium text-brand-forest">#{String(inv.number).padStart(4, '0')}</td>
                  <td className="px-4 py-2">{inv.customer?.name ?? '—'}</td>
                  <td className="tnum px-4 py-2 text-right">{formatMoney(Number(inv.subtotal))}</td>
                  <td className="tnum px-4 py-2 text-right">{formatMoney(Number(inv.tax))}</td>
                  <td className="tnum px-4 py-2 text-right font-semibold">{formatMoney(Number(inv.total))}</td>
                  <td className="tnum px-4 py-2 text-right text-brand-forest">{formatMoney(paidAmount(inv))}</td>
                  <td className="tnum px-4 py-2 text-right font-medium text-amber-600">{formatMoney(bal)}</td>
                  <td className="px-4 py-2 text-muted">{new Date(inv.dueDate).toLocaleDateString('es-DO')}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>{st.label}</span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      {inv.status === 'PENDIENTE' && (
                        <button onClick={() => { setPaying(inv); setPayAmount(String(bal)) }} className="flex items-center gap-1 text-xs font-medium text-brand-leaf transition hover:text-brand-forest">
                          <CheckCircle2 size={14} /> Pagar
                        </button>
                      )}
                      {inv.status === 'PENDIENTE' && (
                        <button onClick={() => handleCancel(inv)} className="flex items-center gap-1 text-xs font-medium text-red-500 transition hover:text-red-600">
                          <Ban size={14} /> Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-12">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-mint text-brand-leaf">
                      <FilePlus2 size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {statusFilter ? 'Sin facturas en este estado' : 'Todavía no hay facturas'}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {statusFilter ? 'Prueba con otro filtro.' : 'Crea una factura a crédito para empezar a controlar cuentas por cobrar.'}
                      </p>
                    </div>
                    {!statusFilter && (
                      <button
                        onClick={() => setCreating(true)}
                        className="mt-1 flex items-center gap-1.5 rounded-lg bg-brand-mint px-3 py-1.5 text-xs font-semibold text-brand-forest transition hover:bg-brand-mint-strong"
                      >
                        <Plus size={14} /> Nueva factura
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}