import { describe, it, expect } from 'vitest'
import { round2, computeTotals, formatMoney, ITBIS_RATE } from '@/lib/utils'

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

  it('nunca deja el total negativo aunque el descuento supere el subtotal', () => {
    const totals = computeTotals(500, 999)
    expect(totals.discount).toBe(999)
    expect(totals.tax).toBe(0)
    expect(totals.total).toBe(0)
  })

  it('formatea moneda dominicana', () => {
    expect(formatMoney(1000)).toContain('RD$')
    expect(formatMoney(1234567.5)).toContain(',')
  })
})