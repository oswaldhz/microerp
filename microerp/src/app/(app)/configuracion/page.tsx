'use client'

import { useEffect, useState } from 'react'
import { ScrollText, ShieldCheck } from 'lucide-react'
import PageHeader from '@/components/PageHeader'

type Log = {
  id: string
  action: string
  entity: string
  entityId?: string
  details?: string
  createdAt: string
  user?: { name: string; email: string } | null
}

const ACTION_LABEL: Record<string, string> = {
  LOGIN: 'Inicio de sesión',
  CREATE_SALE: 'Venta',
  REFUND_SALE: 'Devolución',
  CREATE_PRODUCT: 'Producto',
  UPDATE_PRODUCT: 'Producto',
  DELETE_PRODUCT: 'Producto',
  CREATE_CUSTOMER: 'Cliente',
  UPDATE_CUSTOMER: 'Cliente',
  DELETE_CUSTOMER: 'Cliente',
  CREATE_SUPPLIER: 'Proveedor',
  UPDATE_SUPPLIER: 'Proveedor',
  DELETE_SUPPLIER: 'Proveedor',
  CREATE_EMPLOYEE: 'Empleado',
  UPDATE_EMPLOYEE: 'Empleado',
  DELETE_EMPLOYEE: 'Empleado',
  CREATE_EXPENSE: 'Gasto',
  UPDATE_EXPENSE: 'Gasto',
  DELETE_EXPENSE: 'Gasto',
  CREATE_INVOICE: 'Factura',
  CANCEL_INVOICE: 'Factura',
  PAY_INVOICE: 'Pago',
  CREATE_PURCHASE_ORDER: 'Compra',
  RECEIVE_PURCHASE_ORDER: 'Compra',
  CANCEL_PURCHASE_ORDER: 'Compra',
}

export default function ConfiguracionPage() {
  const [logs, setLogs] = useState<Log[]>([])

  useEffect(() => {
    fetch('/api/audit')
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []))
      .catch(() => setLogs([]))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración y auditoría"
        description="Registro de todas las acciones del sistema y datos de la empresa."
      />

      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-mint text-brand-leaf">
          <ShieldCheck size={20} />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Traza de auditoría</p>
          <p className="text-xs text-muted">Cada login, venta, pago y cambio de inventario queda registrado aquí.</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-2 font-semibold">Fecha</th>
              <th className="px-4 py-2 font-semibold">Usuario</th>
              <th className="px-4 py-2 font-semibold">Acción</th>
              <th className="px-4 py-2 font-semibold">Entidad</th>
              <th className="px-4 py-2 font-semibold">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {logs.slice(0, 100).map((log) => (
              <tr key={log.id} className="border-b border-line last:border-0 hover:bg-paper/70">
                <td className="px-4 py-2 text-muted">
                  {new Date(log.createdAt).toLocaleString('es-DO', { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td className="px-4 py-2">{log.user?.name ?? '—'}</td>
                <td className="px-4 py-2 font-medium text-ink">{ACTION_LABEL[log.action] ?? log.action}</td>
                <td className="px-4 py-2">
                  <span className="rounded-full bg-brand-mint px-2 py-0.5 text-[11px] font-medium text-brand-forest">{log.entity}</span>
                </td>
                <td className="px-4 py-2 text-muted">{log.details ?? '—'}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-mint text-brand-leaf">
                      <ScrollText size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">Sin registros de auditoría</p>
                      <p className="mt-0.5 text-xs text-muted">Las acciones del sistema aparecerán aquí automáticamente.</p>
                    </div>
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