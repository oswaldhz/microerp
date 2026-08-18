'use client'

import { useEffect, useState } from 'react'
import { Check, Palette, Store } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { useToast } from '@/components/ToastProvider'
import { useBranding } from '@/lib/use-branding'
import { THEMES, type Theme, applyTheme, storeTheme, getActiveThemeId } from '@/lib/themes'

export default function PersonalizacionPage() {
  const { branding, refresh } = useBranding()
  const toast = useToast()
  const [loaded, setLoaded] = useState(false)
  const [appName, setAppName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [savingName, setSavingName] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (loaded) return
    if (!branding.companyName) return
    setLoaded(true)
    setAppName(branding.appName ?? '')
    setActiveId(getActiveThemeId())
  }, [branding, loaded])

  async function handleSaveName(clear: boolean) {
    const next = clear ? '' : appName.trim()
    setSavingName(true)
    try {
      const res = await fetch('/api/companies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: branding.companyName, appName: next || null }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Error guardando el nombre')
        return
      }
      setAppName(next)
      toast.success(clear ? 'Nombre ocultado — solo se muestra el icono' : 'Nombre de la marca guardado')
      await refresh()
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSavingName(false)
    }
  }

  async function handleUpload() {
    if (!selectedFile) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      const res = await fetch('/api/upload/logo', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Error subiendo la imagen')
        return
      }
      toast.success('Logo de la marca actualizado')
      setSelectedFile(null)
      await refresh()
    } catch {
      toast.error('Error de conexión')
    } finally {
      setUploading(false)
    }
  }

  function handleTheme(theme: Theme) {
    applyTheme(theme)
    storeTheme(theme)
    setActiveId(theme.id)
    toast.success(`Tema «${theme.name}» aplicado`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personalización"
        description="Nombre y logo de la marca, y los colores de la aplicación."
      />

      {branding.role === 'ADMIN' && (
        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink">
            <Store size={16} className="text-brand-leaf" /> Marca
          </h2>
          <p className="mb-4 text-sm text-muted">
            Nombre y logo que aparecen arriba a la izquierda. Déjalo vacío para mostrar solo el icono.
          </p>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <input
              data-testid="app-name-input"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="Nombre de la marca…"
              maxLength={40}
              className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-brand-leaf focus:ring-2 focus:ring-brand-mint sm:w-72"
            />
            <button
              data-testid="save-app-name"
              onClick={() => handleSaveName(false)}
              disabled={savingName}
              className="rounded-lg bg-brand-forest px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-ink disabled:opacity-40"
            >
              Guardar
            </button>
            <button
              data-testid="clear-app-name"
              onClick={() => handleSaveName(true)}
              disabled={savingName}
              className="rounded-lg border border-line-strong px-4 py-2 text-sm font-medium text-muted transition hover:bg-paper disabled:opacity-40"
            >
              Ocultar nombre
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-brand-mint text-brand-forest shadow-sm">
              {branding.logo ? (
                <img src={branding.logo} alt="" className="h-full w-full object-cover" />
              ) : (
                <Store size={24} />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="cursor-pointer rounded-lg border border-line-strong px-4 py-2 text-sm font-medium text-muted transition hover:bg-paper">
                Elegir imagen…
                <input
                  type="file"
                  data-testid="logo-file-input"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    setSelectedFile(e.target.files?.[0] ?? null)
                    e.target.value = ''
                  }}
                />
              </label>
              <button
                data-testid="upload-logo"
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="rounded-lg bg-brand-forest px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-ink disabled:cursor-not-allowed disabled:opacity-40"
              >
                {uploading ? 'Subiendo…' : 'Subir logo'}
              </button>
              {selectedFile && (
                <span className="text-xs text-muted">{selectedFile.name}</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink">
          <Palette size={16} className="text-brand-leaf" /> Tema de colores
        </h2>
        <p className="mb-4 text-sm text-muted">Se guarda en este navegador y se aplica en toda la aplicación.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              data-testid={`theme-${theme.id}`}
              onClick={() => handleTheme(theme)}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                activeId === theme.id ? 'border-brand-leaf ring-2 ring-brand-mint' : 'border-line hover:border-line-strong'
              }`}
            >
              <span
                className="h-8 w-8 shrink-0 rounded-full border border-line shadow-sm"
                style={{ backgroundColor: theme.vars['--brand-forest'] }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">{theme.name}</span>
                <span className="block text-[11px] text-muted">{theme.vars['--brand-forest']}</span>
              </span>
              {activeId === theme.id && <Check size={16} className="shrink-0 text-brand-leaf" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}