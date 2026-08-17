'use client'

import CrudTable, { type Column, type Field } from '@/components/CrudTable'

type Customer = {
  id: string
  name: string
  email: string
  phone: string
  address: string
  level: string
}

const columns: Column<Customer>[] = [
  { key: 'name', label: 'Nombre' },
  { key: 'email', label: 'Correo' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'address', label: 'Dirección' },
  {
    key: 'level',
    label: 'Nivel',
    render: (r) => (
      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${r.level === 'ORO' ? 'bg-amber-50 text-amber-700' : r.level === 'PLATA' ? 'bg-zinc-100 text-zinc-600' : 'bg-orange-50 text-orange-700'}`}>
        {r.level}
      </span>
    ),
  },
]

const fields: Field[] = [
  { key: 'name', label: 'Nombre completo', required: true },
  { key: 'email', label: 'Correo electrónico', type: 'email' },
  { key: 'phone', label: 'Teléfono', type: 'tel' },
  { key: 'address', label: 'Dirección' },
  {
    key: 'level',
    label: 'Nivel',
    type: 'select',
    options: [
      { value: 'BRONCE', label: 'Bronce' },
      { value: 'PLATA', label: 'Plata' },
      { value: 'ORO', label: 'Oro' },
    ],
  },
]

export default function ClientesPage() {
  return (
    <CrudTable<Customer>
      title="Clientes"
      description="Datos y niveles de tus clientes (Bronce, Plata, Oro)."
      entityKey="customers"
      columns={columns}
      fields={fields}
      searchPlaceholder="Buscar cliente…"
    />
  )
}