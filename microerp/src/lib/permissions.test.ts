import { describe, it, expect } from 'vitest'
import { can, canAny, ROLE_PERMISSIONS } from '@/lib/permissions'
import { Role } from '@/generated/prisma/enums'

describe('permisos por rol', () => {
  it('ADMIN tiene acceso a todo', () => {
    for (const permission of Object.values(ROLE_PERMISSIONS).flat()) {
      expect(can(Role.ADMIN, permission)).toBe(true)
    }
    expect(ROLE_PERMISSIONS[Role.ADMIN]).toContain('audit.view')
    expect(ROLE_PERMISSIONS[Role.ADMIN]).toContain('companies.manage')
  })

  it('VENDEDOR ve y gestiona ventas pero no reportes ni auditoría', () => {
    expect(can(Role.VENDEDOR, 'sales.view')).toBe(true)
    expect(can(Role.VENDEDOR, 'sales.create')).toBe(true)
    expect(can(Role.VENDEDOR, 'customers.view')).toBe(true)
    expect(can(Role.VENDEDOR, 'reports.view')).toBe(false)
    expect(can(Role.VENDEDOR, 'audit.view')).toBe(false)
    expect(can(Role.VENDEDOR, 'expenses.manage')).toBe(false)
  })

  it('CONTADOR gestiona gastos y facturas pero no inventario ni auditoría', () => {
    expect(can(Role.CONTADOR, 'expenses.manage')).toBe(true)
    expect(can(Role.CONTADOR, 'invoices.manage')).toBe(true)
    expect(can(Role.CONTADOR, 'inventory.manage')).toBe(false)
    expect(can(Role.CONTADOR, 'audit.view')).toBe(false)
    expect(can(Role.CONTADOR, 'reports.view')).toBe(true)
  })

  it('canAny devuelve true si al menos un permiso aplica', () => {
    expect(canAny(Role.VENDEDOR, ['audit.view', 'sales.view'])).toBe(true)
    expect(canAny(Role.VENDEDOR, ['audit.view', 'companies.manage'])).toBe(false)
  })

  it('todos los roles ven Personalización', () => {
    expect(can(Role.ADMIN, 'personalizacion.view')).toBe(true)
    expect(can(Role.VENDEDOR, 'personalizacion.view')).toBe(true)
    expect(can(Role.CONTADOR, 'personalizacion.view')).toBe(true)
  })
})