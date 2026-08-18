'use client'

import { useEffect } from 'react'
import { applyTheme, getStoredTheme } from '@/lib/themes'

export default function ThemeInit() {
  useEffect(() => {
    const theme = getStoredTheme()
    if (theme) applyTheme(theme)
  }, [])
  return null
}