'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Info } from 'lucide-react'

export interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

type ConfirmContextValue = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmContextValue>(() => Promise.resolve(false))

export function useConfirm(): ConfirmContextValue {
  return useContext(ConfirmContext)
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolveRef = useRef<(value: boolean) => void>(() => {})
  const confirmRef = useRef<HTMLButtonElement>(null)
  const [mounted, setMounted] = useState(false)
  const [lastFocused, setLastFocused] = useState<HTMLElement | null>(null)

  useEffect(() => setMounted(true), [])

  const confirmDialog = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setLastFocused(document.activeElement as HTMLElement | null)
        resolveRef.current = resolve
        setOptions(opts)
      }),
    [],
  )

  const close = useCallback((result: boolean) => {
    resolveRef.current(result)
    setOptions(null)
  }, [])

  useEffect(() => {
    if (!options) return
    confirmRef.current?.focus()
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close(false)
      if (e.key === 'Enter' && e.target === confirmRef.current) close(true)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [options, close])

  useEffect(() => {
    if (!options && lastFocused) {
      lastFocused.focus()
      setLastFocused(null)
    }
  }, [options, lastFocused])

  return (
    <ConfirmContext.Provider value={confirmDialog}>
      {children}
      {mounted && options
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
              onClick={() => close(false)}
              role="dialog"
              aria-modal="true"
              aria-label={options.title}
            >
              <div
                className="w-full max-w-sm rounded-xl border border-line bg-surface p-5 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      options.danger ? 'bg-red-50 text-red-600' : 'bg-brand-mint text-brand-forest'
                    }`}
                  >
                    {options.danger ? <AlertTriangle size={20} /> : <Info size={20} />}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-ink">{options.title}</h2>
                    <p className="mt-1 text-sm text-muted">{options.message}</p>
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={() => close(false)}
                    className="rounded-lg border border-line-strong px-4 py-2 text-sm font-medium text-muted transition hover:bg-paper"
                  >
                    {options.cancelLabel ?? 'Cancelar'}
                  </button>
                  <button
                    ref={confirmRef}
                    onClick={() => close(true)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition ${
                      options.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-forest hover:bg-brand-leaf'
                    }`}
                  >
                    {options.confirmLabel ?? 'Confirmar'}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </ConfirmContext.Provider>
  )
}