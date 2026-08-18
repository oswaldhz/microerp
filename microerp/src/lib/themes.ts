export type ThemeVars = {
  '--brand-ink': string
  '--brand-forest': string
  '--brand-leaf': string
  '--brand-mint': string
  '--brand-mint-strong': string
  '--paper': string
}

export type Theme = { id: string; name: string; vars: ThemeVars }

export const THEMES: Theme[] = [
  {
    id: 'verde-bosque',
    name: 'Verde Bosque',
    vars: {
      '--brand-ink': '#13261c',
      '--brand-forest': '#1b4332',
      '--brand-leaf': '#2d6a4f',
      '--brand-mint': '#e6f2ec',
      '--brand-mint-strong': '#cfe5da',
      '--paper': '#f7f5f0',
    },
  },
  {
    id: 'azul',
    name: 'Azul',
    vars: {
      '--brand-ink': '#0c1a33',
      '--brand-forest': '#1e3a8a',
      '--brand-leaf': '#3b82f6',
      '--brand-mint': '#e8f0fe',
      '--brand-mint-strong': '#d0e0fb',
      '--paper': '#f6f8fc',
    },
  },
  {
    id: 'violeta',
    name: 'Violeta',
    vars: {
      '--brand-ink': '#1c1430',
      '--brand-forest': '#4c1d95',
      '--brand-leaf': '#7c3aed',
      '--brand-mint': '#f1eafc',
      '--brand-mint-strong': '#e2d5f9',
      '--paper': '#faf8fd',
    },
  },
  {
    id: 'ambar',
    name: 'Ámbar',
    vars: {
      '--brand-ink': '#2a1c0c',
      '--brand-forest': '#92400e',
      '--brand-leaf': '#d97706',
      '--brand-mint': '#fdf3e3',
      '--brand-mint-strong': '#f9e4c3',
      '--paper': '#fbf8f2',
    },
  },
  {
    id: 'rojo',
    name: 'Rojo',
    vars: {
      '--brand-ink': '#2b0d0d',
      '--brand-forest': '#991b1b',
      '--brand-leaf': '#dc2626',
      '--brand-mint': '#fdeaea',
      '--brand-mint-strong': '#f8d4d4',
      '--paper': '#fcf7f6',
    },
  },
]

export const THEME_STORAGE_KEY = 'microerp-theme'

export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value)
  }
}

export function getStoredTheme(): Theme | null {
  const id = localStorage.getItem(THEME_STORAGE_KEY)
  return THEMES.find((t) => t.id === id) ?? null
}

export function storeTheme(theme: Theme): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme.id)
}

export function getActiveThemeId(): string {
  return getStoredTheme()?.id ?? THEMES[0].id
}