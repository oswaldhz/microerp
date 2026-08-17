import { Role } from '@/generated/prisma/enums'

export type Permission =
  | 'dashboard.view'
  | 'sales.create'
  | 'sales.view'
  | 'sales.refund'
  | 'inventory.view'
  | 'inventory.manage'
  | 'customers.view'
  | 'customers.manage'
  | 'suppliers.view'
  | 'suppliers.manage'
  | 'employees.view'
  | 'employees.manage'
  | 'expenses.view'
  | 'expenses.manage'
  | 'invoices.view'
  | 'invoices.manage'
  | 'reports.view'
  | 'audit.view'
  | 'users.manage'
  | 'companies.manage'
  | 'personalizacion.view'

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    'dashboard.view',
    'sales.create',
    'sales.view',
    'sales.refund',
    'inventory.view',
    'inventory.manage',
    'customers.view',
    'customers.manage',
    'suppliers.view',
    'suppliers.manage',
    'employees.view',
    'employees.manage',
    'expenses.view',
    'expenses.manage',
    'invoices.view',
    'invoices.manage',
    'reports.view',
    'audit.view',
    'users.manage',
    'companies.manage',
    'personalizacion.view',
  ],
  VENDEDOR: [
    'dashboard.view',
    'sales.create',
    'sales.view',
    'inventory.view',
    'customers.view',
    'customers.manage',
    'personalizacion.view',
  ],
  CONTADOR: [
    'dashboard.view',
    'sales.view',
    'inventory.view',
    'suppliers.view',
    'expenses.view',
    'expenses.manage',
    'invoices.view',
    'invoices.manage',
    'reports.view',
    'personalizacion.view',
  ],
}

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function canAny(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => can(role, p))
}