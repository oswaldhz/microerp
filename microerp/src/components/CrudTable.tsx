'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Inbox, Pencil, Plus, Search, Trash2, UserCheck, UserX } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Tooltip from '@/components/Tooltip'
import { formatPhone, normalizePhone } from '@/lib/utils'

export type Field = {
  key: string
  label: string
  type?: 'text' | 'number' | 'email' | 'select' | 'date' | 'tel' | 'password'
  options?: { value: string; label: string }[]
  required?: boolean
}

export type ToggleAction = {
  key: string
  activeLabel: string
  inactiveLabel: string
  activeConfirm: string
  inactiveConfirm: string
}

export type Column<T> = {
  key: string
  label: string
  render?: (row: T) => React.ReactNode
  className?: string
}

const inputCls =
  'w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-brand-leaf focus:ring-2 focus:ring-brand-mint'

export default function CrudTable<T extends { id: string }>({
  title,
  description,
  entityKey,
  columns,
  fields,
  searchPlaceholder = 'Buscar…',
  subtitle,
  emptyHint,
  toggle,
}: {
  title: string
  description: string
  entityKey: string
  columns: Column<T>[]
  fields: Field[]
  searchPlaceholder?: string
  subtitle?: (rows: T[]) => React.ReactNode
  emptyHint?: string
  toggle?: ToggleAction
}) {
  const [rows, setRows] = useState<T[]>([])
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<T | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/${entityKey}`)
      const data = await res.json()
      setRows(data[entityKey] ?? [])
    } catch {
      setMessage({ type: 'error', text: 'Error cargando datos' })
    }
  }, [entityKey])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    if (!query) return rows
    const q = query.toLowerCase()
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q))
  }, [rows, query])

  const telKeys = useMemo(
    () => new Set(fields.filter((f) => f.type === 'tel').map((f) => f.key)),
    [fields],
  )

  const passwordKeys = useMemo(
    () => new Set(fields.filter((f) => f.type === 'password').map((f) => f.key)),
    [fields],
  )

  function renderCell(c: Column<T>, row: T): React.ReactNode {
    const raw = String((row as Record<string, unknown>)[c.key] ?? '—')
    if (passwordKeys.has(c.key) && raw !== '—') return '••••••••'
    return telKeys.has(c.key) && raw !== '—' ? formatPhone(raw) : raw
  }

  function resetForm() {
    setForm({})
    setCreating(false)
    setEditing(null)
  }

  async function handleSave() {
    const url = creating ? `/api/${entityKey}` : `/api/${entityKey}?id=${editing?.id}`
    const method = creating ? 'POST' : 'PUT'
    const payload: Record<string, string> = {}
    for (const f of fields) {
      const value = form[f.key] ?? ''
      if (f.type === 'password' && !value) continue
      payload[f.key] = f.type === 'tel' ? normalizePhone(value) : value
    }
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({ error: `Error del servidor (${res.status})` }))
    if (!res.ok) {
      setMessage({ type: 'error', text: data.error ?? 'Error al guardar' })
      return
    }
    setMessage({ type: 'ok', text: creating ? 'Registro creado' : 'Registro actualizado' })
    resetForm()
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este registro?')) return
    const res = await fetch(`/api/${entityKey}?id=${id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({ error: `Error del servidor (${res.status})` }))
    setMessage(data.error ? { type: 'error', text: data.error } : { type: 'ok', text: 'Registro eliminado' })
    load()
  }

  async function handleToggle(row: T) {
    if (!toggle) return
    const isActive = Boolean((row as Record<string, unknown>)[toggle.key])
    if (!confirm(isActive ? toggle.activeConfirm : toggle.inactiveConfirm)) return
    const res = await fetch(`/api/${entityKey}?id=${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [toggle.key]: !isActive }),
    })
    const data = await res.json().catch(() => ({ error: `Error del servidor (${res.status})` }))
    setMessage(
      data.error
        ? { type: 'error', text: data.error }
        : { type: 'ok', text: isActive ? toggle.inactiveLabel : toggle.activeLabel },
    )
    load()
  }

  function startEdit(row: T) {
    setEditing(row)
    setCreating(false)
    setForm(
      Object.fromEntries(
        fields.map((f) => {
          if (f.type === 'password') return [f.key, '']
          const value = String((row as Record<string, unknown>)[f.key] ?? '')
          return [f.key, f.type === 'tel' ? formatPhone(value) : value]
        }),
      ),
    )
  }

  function openCreate() {
    setCreating(true)
    setEditing(null)
    setForm({})
  }

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description}>
        {subtitle && <div className="mr-auto text-sm text-muted">{subtitle(rows)}</div>}
        <Tooltip label={`Añade un nuevo ${title.toLowerCase()}`}>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-brand-forest px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-ink"
          >
            <Plus size={16} /> Nuevo
          </button>
        </Tooltip>
      </PageHeader>

      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${message.type === 'ok' ? 'bg-brand-mint text-brand-forest' : 'bg-red-50 text-red-600'}`}>
          {message.text}
        </div>
      )}

      {(creating || editing) && (
        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-ink">
            {creating ? `Nuevo registro en ${title.toLowerCase()}` : 'Editar registro'}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-xs font-medium text-muted">{f.label}</label>
                {f.type === 'select' ? (
                  <select
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">Seleccionar…</option>
                    {f.options?.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type === 'password' ? 'password' : (f.type ?? 'text')}
                    required={f.type === 'password' ? creating && f.required : f.required}
                    autoComplete={f.type === 'password' ? 'new-password' : undefined}
                    inputMode={f.type === 'tel' ? 'tel' : undefined}
                    maxLength={f.type === 'tel' ? 14 : f.type === 'password' ? 72 : undefined}
                    value={form[f.key] ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [f.key]: f.type === 'tel' ? formatPhone(e.target.value) : e.target.value,
                      })
                    }
                    placeholder={f.type === 'password' && !creating ? 'Dejar vacío para no cambiar' : f.label}
                    className={inputCls}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleSave} className="rounded-lg bg-brand-forest px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-ink">
              Guardar
            </button>
            <button onClick={resetForm} className="rounded-lg border border-line-strong px-4 py-2 text-sm font-medium text-muted transition hover:bg-paper">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 rounded-lg border border-line-strong bg-surface px-3 sm:w-72">
        <Search size={16} className="shrink-0 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted/60"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              {columns.map((c) => (
                <th key={c.key} className={`px-4 py-2 font-semibold ${c.className ?? ''}`}>{c.label}</th>
              ))}
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-b border-line last:border-0 hover:bg-paper/70">
                {columns.map((c) => (
                  <td key={c.key} className={`px-4 py-2 text-ink ${c.className ?? ''}`}>
                    {c.render ? c.render(row) : renderCell(c, row)}
                  </td>
                ))}
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-1">
                    <Tooltip label="Editar">
                      <button onClick={() => startEdit(row)} className="rounded p-1.5 text-muted transition hover:bg-brand-mint hover:text-brand-forest">
                        <Pencil size={15} />
                      </button>
                    </Tooltip>
                    {toggle ? (
                      (() => {
                        const isActive = Boolean((row as Record<string, unknown>)[toggle.key])
                        return (
                          <Tooltip label={isActive ? toggle.activeLabel : toggle.inactiveLabel}>
                            <button
                              onClick={() => handleToggle(row)}
                              className={`rounded p-1.5 transition hover:bg-brand-mint ${isActive ? 'text-red-400 hover:text-red-600' : 'text-brand-leaf hover:text-brand-forest'}`}
                            >
                              {isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                            </button>
                          </Tooltip>
                        )
                      })()
                    ) : (
                      <Tooltip label="Eliminar">
                        <button onClick={() => handleDelete(row.id)} className="rounded p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600">
                          <Trash2 size={15} />
                        </button>
                      </Tooltip>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-12">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-mint text-brand-leaf">
                      <Inbox size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {query ? 'Sin resultados para tu búsqueda' : 'Todavía no hay registros'}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {query
                          ? 'Prueba con otro término.'
                          : emptyHint ?? `Usa el botón «Nuevo» para añadir el primer ${title.toLowerCase()}.`}
                      </p>
                    </div>
                    {!query && (
                      <button
                        onClick={openCreate}
                        className="mt-1 flex items-center gap-1.5 rounded-lg bg-brand-mint px-3 py-1.5 text-xs font-semibold text-brand-forest transition hover:bg-brand-mint-strong"
                      >
                        <Plus size={14} /> Añadir primero
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}