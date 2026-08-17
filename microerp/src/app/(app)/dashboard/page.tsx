import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { requirePermission } from '@/lib/api-helpers'
import { dashboardData } from '@/services/dashboard.service'
import { lowStockProducts } from '@/services/products.service'
import { formatMoney } from '@/lib/utils'
import StatCard from '@/components/StatCard'
import SalesChart from '@/components/SalesChart'
import PageHeader from '@/components/PageHeader'
import { AlertTriangle, ArrowUpRight, DollarSign, FileText, Package, ShoppingCart, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  const checked = requirePermission(session, 'dashboard.view')
  if (checked instanceof Response) redirect('/login')

  const [data, lowStock] = await Promise.all([
    dashboardData(session.companyId),
    lowStockProducts(session.companyId),
  ])

  const up = data.weekChange >= 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Resumen de ventas, ganancias y alertas del negocio."
      >
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${up ? 'bg-brand-mint text-brand-forest' : 'bg-red-50 text-red-600'}`}>
          {up ? '▲' : '▼'} {Math.abs(data.weekChange)}% vs semana anterior
        </span>
      </PageHeader>

      <div className="flex items-center gap-4 rounded-xl bg-brand-forest p-5 text-white shadow-sm">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/10">
          <ArrowUpRight size={22} className="text-brand-mint" />
        </div>
        <div>
          <p className="font-display text-sm font-semibold">Hola, {session.name.split(' ')[0]} — así va tu negocio hoy</p>
          <p className="mt-0.5 text-sm text-white/70">
            {data.salesTodayCount > 0
              ? `Ya van ${data.salesTodayCount} ${data.salesTodayCount === 1 ? 'venta' : 'ventas'} por ${formatMoney(data.salesToday)} hoy.`
              : 'Aún no hay ventas hoy: abre el POS y registra la primera.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard title="Ventas hoy" value={formatMoney(data.salesToday)} subtitle={`${data.salesTodayCount} transacciones`} icon={DollarSign} accent="leaf" />
        <StatCard title="Ventas semanales" value={formatMoney(data.salesWeek)} subtitle="Últimos 7 días" icon={TrendingUp} accent="forest" />
        <StatCard title="Ventas del mes" value={formatMoney(data.salesMonth)} subtitle={`${data.salesMonthCount} transacciones`} icon={ShoppingCart} accent="sky" />
        <StatCard title="Productos" value={String(data.productCount)} subtitle={`${data.lowStockCount} con stock bajo`} icon={Package} accent="amber" />
        <StatCard title="Facturas pendientes" value={String(data.pendingInvoices)} subtitle="Por cobrar" icon={FileText} accent="red" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-ink">Ventas de los últimos 7 días</h2>
          <SalesChart data={data.salesByDay} />
        </div>

        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-ink">Resumen del mes</h2>
          <dl className="space-y-3">
            {[
              ['Ventas', formatMoney(data.salesMonth), 'text-brand-forest'],
              ['Gastos', formatMoney(data.expensesMonth), 'text-red-600'],
              ['Ganancia estimada', formatMoney(data.profitMonth), 'text-brand-leaf'],
            ].map(([label, value, color]) => (
              <div key={label} className="flex items-center justify-between border-b border-line pb-3 last:border-0 last:pb-0">
                <dt className="text-sm text-muted">{label}</dt>
                <dd className={`tnum text-sm font-bold ${color}`}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-600" />
            <h2 className="text-sm font-semibold text-amber-800">Productos con stock bajo</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((p) => (
              <span key={p.id} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                {p.name} — {Number(p.stock)} / mínimo {Number(p.minStock)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}