'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Store } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('reason') === 'inactiva') {
      setError('Tu cuenta está dada de baja. Contacta al administrador.')
      window.history.replaceState(null, '', '/login')
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al iniciar sesión')
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-4">
      <div className="w-full max-w-md">
        <div className="receipt-edge rounded-2xl border border-line bg-surface p-8 shadow-lg">
          <div className="mb-8 flex flex-col items-center gap-3 border-b border-dashed border-line-strong pb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-forest text-brand-mint shadow-sm">
              <Store size={28} />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-brand-ink">MicroERP</h1>
            <p className="text-sm text-muted">Inicia sesión en tu cuenta</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@urban-shoes.com"
                className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm outline-none transition placeholder:text-muted/60 focus:border-brand-leaf focus:ring-2 focus:ring-brand-mint"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm outline-none transition placeholder:text-muted/60 focus:border-brand-leaf focus:ring-2 focus:ring-brand-mint"
              />
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-forest py-2.5 text-sm font-semibold text-white transition hover:bg-brand-ink disabled:opacity-50"
            >
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Demo: admin@urban-shoes.com / Admin123! · carlos@urban-shoes.com / Vendedor123! · maria@urban-shoes.com / Contador123!
        </p>
      </div>
    </div>
  )
}