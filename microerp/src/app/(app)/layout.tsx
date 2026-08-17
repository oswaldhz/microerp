import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Sidebar, { type NavSection } from '@/components/Sidebar'
import NotificationBell from '@/components/NotificationBell'
import SessionWatcher from '@/components/SessionWatcher'
import ThemeInit from '@/components/ThemeInit'
import HeaderUser from '@/components/HeaderUser'
import { can } from '@/lib/permissions'
import { ConfirmProvider } from '@/components/ConfirmProvider'
import { ToastProvider } from '@/components/ToastProvider'

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Operación',
    items: [
      { href: '/dashboard', label: 'Dashboard', description: 'Resumen de ventas, ganancias y alertas del negocio.', icon: 'dashboard' as const },
      { href: '/ventas', label: 'Ventas', description: 'Registra ventas del mostrador, devuelve ventas y consulta el historial.', icon: 'ventas' as const, permission: 'sales.view' as const },
      { href: '/compras', label: 'Compras', description: 'Crea órdenes de compra a proveedores y recibe mercancía.', icon: 'compras' as const, permission: 'inventory.manage' as const },
    ],
  },
  {
    title: 'Catálogo',
    items: [
      { href: '/inventario', label: 'Inventario', description: 'Productos, precios, existencias y stock mínimo.', icon: 'inventario' as const, permission: 'inventory.view' as const },
      { href: '/clientes', label: 'Clientes', description: 'Datos y niveles de tus clientes.', icon: 'clientes' as const, permission: 'customers.view' as const },
      { href: '/proveedores', label: 'Proveedores', description: 'Proveedores a los que compras mercancía.', icon: 'proveedores' as const, permission: 'suppliers.view' as const },
    ],
  },
  {
    title: 'Finanzas',
    items: [
      { href: '/facturas', label: 'Facturas', description: 'Factura a clientes, registra pagos y controla saldos.', icon: 'facturas' as const, permission: 'invoices.view' as const },
      { href: '/gastos', label: 'Gastos', description: 'Registra los gastos operativos del negocio.', icon: 'gastos' as const, permission: 'expenses.view' as const },
      { href: '/reportes', label: 'Reportes', description: 'Análisis de ventas, productos y rendimiento.', icon: 'reportes' as const, permission: 'reports.view' as const },
    ],
  },
  {
    title: 'Administración',
    items: [
      { href: '/empleados', label: 'Empleados', description: 'Usuarios del sistema y sus roles.', icon: 'empleados' as const, permission: 'employees.view' as const },
      { href: '/configuracion', label: 'Configuración', description: 'Auditoría de actividad y datos de la empresa.', icon: 'configuracion' as const, permission: 'audit.view' as const },
      { href: '/personalizacion', label: 'Personalización', description: 'Marca, foto de perfil y temas de colores.', icon: 'personalizacion' as const, permission: 'personalizacion.view' as const },
    ],
  },
]

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.permission || can(session.role, item.permission)),
  })).filter((section) => section.items.length > 0)

  return (
    <div className="flex min-h-screen">
      <SessionWatcher />
      <ThemeInit />
      <Sidebar sections={sections} session={session} />
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-line bg-surface px-6">
          <HeaderUser name={session.name} email={session.email} />
          <div className="flex items-center gap-4">
            <NotificationBell />
            <span className="rounded-full bg-brand-mint px-3 py-1 text-xs font-semibold text-brand-forest">
              {session.role}
            </span>
          </div>
        </header>
        <main className="flex-1 p-6">
          <ConfirmProvider>
            <ToastProvider>{children}</ToastProvider>
          </ConfirmProvider>
        </main>
      </div>
    </div>
  )
}