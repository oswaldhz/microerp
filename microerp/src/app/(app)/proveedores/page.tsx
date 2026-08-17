'use client'

import CrudTable, { type Column, type Field } from '@/components/CrudTable'

type Supplier = {
  id: string
  name: string
  contactName: string
  email: string
  phone: string
  address: string
}

const columns: Column<Supplier>[] = [
  { key: 'name', label: 'Empresa' },
  { key: 'contactName', label: 'Contacto' },
  { key: 'email', label: 'Correo' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'address', label: 'Dirección' },
]

const fields: Field[] = [
  { key: 'name', label: 'Nombre de la empresa', required: true },
  { key: 'contactName', label: 'Persona de contacto' },
  { key: 'email', label: 'Correo electrónico', type: 'email' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'address', label: 'Dirección' },
]

export default function ProveedoresPage() {
  return (
    <CrudTable<Supplier>
      title="Proveedores"
      description="Proveedores a los que compras mercancía para la tienda."
      entityKey="suppliers"
      columns={columns}
      fields={fields}
      searchPlaceholder="Buscar proveedor…"
    />
  )
}