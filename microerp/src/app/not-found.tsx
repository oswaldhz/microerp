import Link from 'next/link'
import { Store } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-forest text-brand-mint shadow-lg">
            <Store size={32} />
          </div>
        </div>

        <p className="font-display text-7xl font-black tracking-tight text-brand-ink">404</p>
        <h1 className="font-display text-xl font-bold text-ink">Esta página no está en el catálogo</h1>
        <p className="mt-2 text-sm text-muted">
          El enlace puede estar roto o la página fue movida. Revisa la URL o vuelve al tablero para seguir operando.
        </p>

        <div className="mt-8 flex justify-center">
          <div className="receipt-edge w-64 rounded-xl border border-line bg-surface px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-dashed border-line-strong pb-2 text-[11px] uppercase tracking-wider text-muted">
              <span>MicroERP</span>
              <span>#404</span>
            </div>
            <p className="py-2 font-mono text-xs text-ink">Página no encontrada</p>
            <p className="border-t border-dashed border-line-strong pt-2 text-[11px] text-muted">
              {new Date().toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="mt-8 inline-block rounded-lg bg-brand-forest px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-ink"
        >
          Volver al tablero
        </Link>
      </div>
    </div>
  )
}