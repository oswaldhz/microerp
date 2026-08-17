'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import Tooltip from '@/components/Tooltip'

type Notification = {
  id: string
  type: string
  message: string
  read: boolean
  createdAt: string
}

const TYPE_LABEL: Record<string, string> = {
  STOCK_CRITICO: 'Stock crítico',
  PROVEEDOR_PENDIENTE: 'Proveedor',
  RENDIMIENTO: 'Rendimiento',
  CLIENTE: 'Cliente',
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)

  async function load() {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnread(data.unread)
      }
    } catch {
      // silencioso
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [])

  async function markAll() {
    await fetch('/api/notifications', { method: 'PUT' })
    setUnread(0)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <div className="relative">
      <Tooltip label={unread > 0 ? `${unread} alerta(s) sin leer` : 'Sin alertas nuevas'}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="relative rounded-lg p-2 text-muted transition hover:bg-brand-mint hover:text-brand-forest"
          aria-label="Notificaciones"
        >
          <Bell size={20} />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </button>
      </Tooltip>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-line bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-sm font-semibold text-ink">Notificaciones</span>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs font-medium text-brand-leaf hover:text-brand-forest">
                Marcar todas leídas
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted">Sin notificaciones</p>
            )}
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`border-b border-line px-4 py-3 ${n.read ? 'opacity-60' : 'bg-brand-mint/50'}`}
              >
                <div className="mb-0.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-brand-leaf">{TYPE_LABEL[n.type] ?? n.type}</span>
                  <span className="text-[10px] text-muted">
                    {new Date(n.createdAt).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <p className="text-sm text-ink">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}