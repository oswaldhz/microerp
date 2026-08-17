'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function SalesChart({ data }: { data: { label: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--muted)' }} />
        <YAxis tick={{ fontSize: 12, fill: 'var(--muted)' }} />
        <Tooltip
          formatter={(value) => [`RD$ ${Number(value).toLocaleString('es-DO')}`, 'Ventas']}
          contentStyle={{ borderRadius: 8, border: '1px solid var(--line)', fontSize: 13 }}
        />
        <Bar dataKey="total" fill="var(--brand-leaf)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}