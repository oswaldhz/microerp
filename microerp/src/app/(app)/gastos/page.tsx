'use client'

import CrudTable, { type Column, type Field } from '@/components/CrudTable'
import { formatMoney } from '@/lib/utils'

type Expense = {
  id: string
  description: string
  category: string
  amount: number | string
  date: string
}

const columns: Column<Expense>[] = [
  { key: 'description', label: 'Descripción' },
  {
    key: 'category',
    label: 'Categoría',
    render: (r) => <span className="rounded-full bg-brand-mint px-2 py-0.5 text-[11px] font-medium text-brand-forest">{r.category}</span>,
  },
  {
    key: 'amount',
    label: 'Monto',
    className: 'text-right',
    render: (r) => <span className="font-semibold text-red-600">{formatMoney(Number(r.amount))}</span>,
  },
  {
    key: 'date',
    label: 'Fecha',
    render: (r) => new Date(r.date).toLocaleDateString('es-DO'),
  },
]

const fields: Field[] = [
  { key: 'description', label: 'Descripción', required: true },
  {
    key: 'category',
    label: 'Categoría',
    type: 'select',
    options: ['Servicios', 'Alquiler', 'Publicidad', 'Transporte', 'Suministros', 'Sueldos', 'Otros'].map((c) => ({ value: c, label: c })),
    required: true,
  },
  { key: 'amount', label: 'Monto (RD$)', type: 'number', required: true },
  { key: 'date', label: 'Fecha', type: 'date', required: true },
]

export default function GastosPage() {
  return (
    <CrudTable<Expense>
      title="Gastos"
      description="Gastos operativos del negocio: servicios, alquiler, sueldos y más."
      entityKey="expenses"
      columns={columns}
      fields={fields}
      searchPlaceholder="Buscar gasto…"
    />
  )
}