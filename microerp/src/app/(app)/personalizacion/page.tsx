'use client'

import { useEffect, useState } from 'react'
import { Check, ImagePlus, Palette, Store } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Avatar from '@/components/Avatar'
import { useToast } from '@/components/ToastProvider'
import { useBranding } from '@/lib/use-branding'
import { THEMES, type Theme, applyTheme, storeTheme, getActiveThemeId } from '@/lib/themes'

export default function PersonalizacionPage() {
  const { branding, refresh } = useBranding()
  const toast = useToast()
  const [userName, setUserName] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [appName, setAppName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [savingName, setSavingName] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setUserName(d.user?.name ?? ''))
      .catch(() => {})
  }, [])

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
      const res = await fetch('/api/upload/avatar', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Error subiendo la imagen')
        return
      }
      toast.success('Foto de perfil actualizada')
      setSelectedFile(null)
      await refresh()
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
        description="Nombre de la marca, tu foto de perfil y los colores de la aplicación."
      />

      {branding.role === 'ADMIN' && (
        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink">
            <Store size={16} className="text-brand-leaf" /> Marca
          </h2>
          <p className="mb-4 text-sm text-muted">
            Nombre que aparece arriba a la izquierda junto al icono. Déjalo vacío para mostrar solo el icono.
          </p>
          <div className="flex flex-wrap items-center gap-2">
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
        </div>
      )}

      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink">
          <ImagePlus size={16} className="text-brand-leaf" /> Foto de perfil
        </h2>
        <p className="mb-4 text-sm text-muted">JPG, PNG o WebP de hasta 2 MB. Se muestra en el menú y en el encabezado.</p>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar src={branding.avatar} name={userName} size={56} />
          <div className="flex flex-wrap items-center gap-2">
            <label className="cursor-pointer rounded-lg border border-line-strong px-4 py-2 text-sm font-medium text-muted transition hover:bg-paper">
              Elegir imagen…
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <button
              data-testid="upload-avatar"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="rounded-lg bg-brand-forest px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              {uploading ? 'Subiendo…' : 'Subir foto'}
            </button>
            {selectedFile && (
              <span className="text-xs text-muted">{selectedFile.name}</span>
            )}
          </div>
        </div>
      </div>

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