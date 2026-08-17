'use client'

import { useCallback, useEffect, useState } from 'react'

export type Branding = {
  appName: string | null
  avatar: string | null
  role: string | null
  companyName: string
}

export function useBranding() {
  const [branding, setBranding] = useState<Branding>({
    appName: null,
    avatar: null,
    role: null,
    companyName: '',
  })

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/branding', { cache: 'no-store' })
      const data = await res.json()
      setBranding({
        appName: data.appName ?? null,
        avatar: data.avatar ?? null,
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

  return { branding, refresh }
}