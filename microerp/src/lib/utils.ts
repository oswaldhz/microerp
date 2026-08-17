export const ITBIS_RATE = 0.18

export function formatMoney(value: number | string | null | undefined): string {
  const n = Number(value ?? 0)
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
  }).format(n)
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function computeTotals(subtotal: number, discount: number): {
  subtotal: number
  discount: number
  tax: number
  total: number
} {
  const s = round2(subtotal)
  const d = round2(Math.min(discount, s))
  const taxable = round2(Math.max(s - d, 0))
  const tax = round2(taxable * ITBIS_RATE)
  const total = round2(taxable + tax)
  return { subtotal: s, discount: d, tax, total }
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '—'
  const d = typeof value === 'string' ? new Date(value) : value
  return d.toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function daysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return startOfDay(d)
}

export function thisMonthStart(): Date {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}