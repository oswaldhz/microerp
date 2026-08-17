'use client'

import { useEffect } from 'react'

export default function SessionWatcher({ intervalMs = 30000 }: { intervalMs?: number }) {
  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (!res.ok) {
          window.location.assign('/login')
          return
        }
        const data = await res.json()
        if (!data.user) window.location.assign('/login')
      } catch {
        // Sin red: se reintenta en el próximo intervalo
      }
    }
    check()
    const timer = setInterval(check, intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])

  return null
}
