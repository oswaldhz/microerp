import { describe, it, expect, beforeEach } from 'vitest'
import { THEMES, applyTheme, storeTheme, getStoredTheme, getActiveThemeId, THEME_STORAGE_KEY } from '@/lib/themes'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('style')
})

describe('temas', () => {
  it('define 5 paletas con verde-bosque como primera', () => {
    expect(THEMES).toHaveLength(5)
    expect(THEMES[0].id).toBe('verde-bosque')
    expect(THEMES[0].vars['--brand-forest']).toBe('#1b4332')
  })

  it('applyTheme sobrescribe las variables del documento', () => {
    applyTheme(THEMES[1])
    expect(document.documentElement.style.getPropertyValue('--brand-forest')).toBe(THEMES[1].vars['--brand-forest'])
  })

  it('storeTheme/getStoredTheme hacen round-trip', () => {
    expect(getStoredTheme()).toBeNull()
    storeTheme(THEMES[2])
    expect(getStoredTheme()?.id).toBe('violeta')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('violeta')
  })

  it('getStoredTheme ignora ids desconocidos', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'no-existe')
    expect(getStoredTheme()).toBeNull()
  })

  it('getActiveThemeId devuelve el tema guardado o el default', () => {
    expect(getActiveThemeId()).toBe('verde-bosque')
    storeTheme(THEMES[3])
    expect(getActiveThemeId()).toBe('ambar')
  })
})