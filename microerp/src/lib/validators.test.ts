import { describe, it, expect } from 'vitest'
import {
  customerSchema,
  supplierSchema,
  employeeSchema,
  companySchema,
} from '@/lib/validators'

describe('validación de teléfono (canónico de 10 dígitos)', () => {
  it('normaliza a dígitos cualquier formato recibido', () => {
    const res = customerSchema.safeParse({ name: 'Juan', phone: '(809) 555-2003' })
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.phone).toBe('8095552003')
  })

  it('acepta dígitos puros y los guarda iguales', () => {
    const res = supplierSchema.safeParse({ name: 'Acme', phone: '8098982111' })
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.phone).toBe('8098982111')
  })

  it('rechaza teléfonos con menos de 10 dígitos', () => {
    const res = employeeSchema.safeParse({
      name: 'Ana',
      position: 'Vendedora',
      salary: 30000,
      commission: 5,
      phone: '809-555-200',
    })
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error.issues[0].message).toBe('El teléfono debe tener 10 dígitos')
  })

  it('acepta teléfono vacío o ausente', () => {
    expect(companySchema.safeParse({ name: 'Mi empresa', phone: '' }).success).toBe(true)
    expect(companySchema.safeParse({ name: 'Mi empresa', phone: null }).success).toBe(true)
    expect(companySchema.safeParse({ name: 'Mi empresa' }).success).toBe(true)
  })

  it('rechaza más de 10 dígitos (p. ej. con prefijo de país)', () => {
    const res = customerSchema.safeParse({ name: 'Juan', phone: '+1 809 555 2003' })
    expect(res.success).toBe(false)
  })
})