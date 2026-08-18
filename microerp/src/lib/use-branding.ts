'use client'

import { useCallback, useEffect, useState } from 'react'

export type Branding = {
  appName: string | null
  logo: string | null
  role: string | null
  companyName: string
}

export function useBranding() {
  const [branding, setBranding] = useState<Branding>({
    appName: null,
    logo: null,
    role: null,
    companyName: '',
  })

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/branding', { cache: 'no-store' })
      const data = await res.json()
      setBranding({
        appName: data.appName ?? null,
        logo: data.logo ?? null,
        role: data.role ?? null,
        companyName: data.companyName ?? '',
      })
    } catch {
      // mantener el estado actual si el fetch falla
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    const events = new EventSource('/api/branding/events')
    events.addEventListener('branding', () => {
      refresh()
    })
    return () => events.close()
  }, [refresh])

  return { branding, refresh }
}