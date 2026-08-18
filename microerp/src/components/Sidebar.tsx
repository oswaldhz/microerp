'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, ShoppingCart, Package, Users, Truck, Briefcase,
  Receipt, FileText, ShoppingBag, BarChart3, Settings, Store, LogOut, Palette,
} from 'lucide-react'
import Tooltip from '@/components/Tooltip'
import Avatar from '@/components/Avatar'
import { useBranding } from '@/lib/use-branding'
import type { SessionPayload } from '@/lib/auth'
import type { Permission } from '@/lib/permissions'

const ICONS = {
  dashboard: LayoutDashboard,
  ventas: ShoppingCart,
  inventario: Package,
  clientes: Users,
  proveedores: Truck,
  empleados: Briefcase,
  gastos: Receipt,
  facturas: FileText,
  compras: ShoppingBag,
  reportes: BarChart3,
  configuracion: Settings,
  personalizacion: Palette,
}

export type NavItem = {
  href: string
  label: string
  description: string
  icon: keyof typeof ICONS
  permission?: Permission
}

export type NavSection = { title: string; items: NavItem[] }

export default function Sidebar({ sections, session }: { sections: NavSection[]; session: SessionPayload }) {
  const pathname = usePathname()
  const router = useRouter()
  const { branding } = useBranding()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside className="flex w-64 flex-col bg-brand-ink text-white">
      <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-leaf text-white shadow-sm">
          {branding.logo ? (
            <img src={branding.logo} data-testid="brand-logo" alt="" className="h-full w-full object-cover" />
          ) : (
            <Store size={18} />
          )}
        </div>
        {branding.appName && (
          <span className="truncate font-display text-lg font-bold tracking-tight">{branding.appName}</span>
        )}
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = ICONS[item.icon]
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Tooltip key={item.href} label={item.description} side="right" className="w-full">
                    <Link
                      href={item.href}
                      className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        active
                          ? 'bg-brand-mint text-brand-ink'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand-leaf" />}
                      <Icon size={18} className={active ? 'text-brand-forest' : ''} />
                      {item.label}
                    </Link>
                  </Tooltip>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="mb-2 flex items-center gap-2 px-3">
          <Avatar name={session.name} size={28} />
          <div className="min-w-0 text-xs text-white/40">
            <p className="truncate">{session.name}</p>
            <p className="truncate">{session.email}</p>
          </div>
        </div>
        <Tooltip label="Cierra tu sesión actual" side="right" className="w-full">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/15 hover:text-red-200"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </Tooltip>
      </div>
    </aside>
  )
}