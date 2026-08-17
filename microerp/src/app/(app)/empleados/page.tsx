'use client'

import CrudTable, { type Column, type Field } from '@/components/CrudTable'
import { formatMoney } from '@/lib/utils'

type Employee = {
  id: string
  name: string
  position: string
  email: string
  phone: string
  salary: number | string
  commission: number | string
  active: boolean
}

const columns: Column<Employee>[] = [
  { key: 'name', label: 'Nombre' },
  { key: 'position', label: 'Puesto' },
  { key: 'email', label: 'Correo' },
  { key: 'phone', label: 'Teléfono' },
  {
    key: 'salary',
    label: 'Salario',
    className: 'text-right',
    render: (r) => <span className="font-medium">{formatMoney(Number(r.salary))}</span>,
  },
  {
    key: 'commission',
    label: 'Comisión',
    className: 'text-right',
    render: (r) => <span>{Number(r.commission)}%</span>,
  },
  {
    key: 'active',
    label: 'Estado',
    render: (r) => (
      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${r.active ? 'bg-brand-mint text-brand-forest' : 'bg-red-50 text-red-600'}`}>
        {r.active ? 'Activo' : 'Inactivo'}
      </span>
    ),
  },
]

const fields: Field[] = [
  { key: 'name', label: 'Nombre completo', required: true },
  { key: 'position', label: 'Puesto', required: true },
  { key: 'email', label: 'Correo electrónico', type: 'email' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'salary', label: 'Salario (RD$)', type: 'number' },
  { key: 'commission', label: 'Comisión (%)', type: 'number' },
]

export default function EmpleadosPage() {
  return (
    <CrudTable<Employee>
      title="Empleados"
      description="Usuarios y personal de la empresa, salarios y comisiones."
      entityKey="employees"
      columns={columns}
      fields={fields}
      searchPlaceholder="Buscar empleado…"
    />
  )
}