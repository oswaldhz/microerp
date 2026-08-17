'use client'

import { useEffect } from 'react'

export default function SessionWatcher({ intervalMs = 30000 }: { intervalMs?: number }) {
  useEffect(() => {
    let active = true
    let es: EventSource | null = null

    function redirect(reason?: string) {
      // Recarga completa a propósito: purga estado en memoria y cookies obsoletas
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/login${reason ? `?reason=${reason}` : ''}`)
    }

    function connectSSE() {
      if (!active) return
      es = new EventSource('/api/auth/events')
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'revoked') {
            es?.close()
            redirect('inactiva')
          }
        } catch {
          // Evento no JSON (p.ej. heartbeat): ignorar
        }
      }
      es.onerror = () => {
        es?.close()
        es = null
      }
    }

    async function poll() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (!res.ok) {
          redirect()
          return
        }
        const data = await res.json()
        if (!data.user) redirect()
      } catch {
        // Sin red: se reintenta en el próximo intervalo
      }
    }

    connectSSE()
    poll()
    const timer = setInterval(() => {
      if (!es) connectSSE()
      poll()
    }, intervalMs)

    return () => {
      active = false
      es?.close()
      clearInterval(timer)
    }
  }, [intervalMs])

  return null
}