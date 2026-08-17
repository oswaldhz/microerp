import { describe, it, expect } from 'vitest'
import { round2, computeTotals, formatMoney, ITBIS_RATE, formatPhone, normalizePhone } from '@/lib/utils'

describe('utils matemáticas', () => {
  it('redondea a 2 decimales', () => {
    expect(round2(10.005)).toBe(10.01)
    expect(round2(19.999)).toBe(20)
    expect(round2(0)).toBe(0)
  })

  it('calcula totales con ITBIS 18%', () => {
    const totals = computeTotals(1000, 0)
    expect(totals.subtotal).toBe(1000)
    expect(totals.discount).toBe(0)
    expect(totals.tax).toBe(round2(1000 * ITBIS_RATE))
    expect(totals.total).toBe(round2(1000 + 1000 * ITBIS_RATE))
  })

  it('aplica descuento antes del ITBIS', () => {
    const totals = computeTotals(1000, 100)
    expect(totals.subtotal).toBe(1000)
    expect(totals.discount).toBe(100)
    expect(totals.total).toBe(round2(900 + 900 * ITBIS_RATE))
  })

  it('recorta el descuento al subtotal y nunca deja el total negativo', () => {
    const totals = computeTotals(500, 999)
    expect(totals.discount).toBe(500)
    expect(totals.tax).toBe(0)
    expect(totals.total).toBe(0)
  })

  it('formatea moneda dominicana', () => {
    expect(formatMoney(1000)).toContain('RD$')
    expect(formatMoney(1234567.5)).toContain(',')
  })
})

describe('utilidades de teléfono', () => {
  it('normaliza cualquier formato a dígitos', () => {
    expect(normalizePhone('(809) 555-2003')).toBe('8095552003')
    expect(normalizePhone('8098982111')).toBe('8098982111')
    expect(normalizePhone('+1 (809) 555-2003 ext 10')).toBe('1809555200310')
    expect(normalizePhone('')).toBe('')
    expect(normalizePhone(null)).toBe('')
    expect(normalizePhone(undefined)).toBe('')
  })

  it('formatea progresivamente mientras se escribe', () => {
    expect(formatPhone('8')).toBe('8')
    expect(formatPhone('809')).toBe('809')
    expect(formatPhone('809898')).toBe('(809) 898')
    expect(formatPhone('8098982111')).toBe('(809) 898-2111')
  })

  it('reformatea un valor ya formateado sin duplicar', () => {
    expect(formatPhone('(809) 555-2003')).toBe('(809) 555-2003')
    expect(formatPhone('8095552003')).toBe('(809) 555-2003')
  })

  it('recorta prefijos de país y se queda con los últimos 10 dígitos', () => {
    expect(formatPhone('18095552003')).toBe('(809) 555-2003')
    expect(formatPhone('0018095552003')).toBe('(809) 555-2003')
    expect(formatPhone('8098982111')).toBe('(809) 898-2111')
  })

  it('deja vacíos los valores sin dígitos', () => {
    expect(formatPhone('—')).toBe('')
    expect(formatPhone('')).toBe('')
  })
})