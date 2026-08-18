'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'

export type ToastKind = 'success' | 'error'

type ToastItem = { id: number; kind: ToastKind; text: string }

type ToastContextValue = {
  success: (text: string) => void
  error: (text: string) => void
}

const ToastContext = createContext<ToastContextValue>({ success: () => {}, error: () => {} })

export function useToast(): ToastContextValue {
  return useContext(ToastContext)
}

const TOAST_DURATION = 4000

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [mounted, setMounted] = useState(false)
  const nextId = useRef(1)

  useEffect(() => setMounted(true), [])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (kind: ToastKind, text: string) => {
      const id = nextId.current++
      setToasts((prev) => [...prev, { id, kind, text }])
      setTimeout(() => dismiss(id), TOAST_DURATION)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider
      value={{ success: (t) => push('success', t), error: (t) => push('error', t) }}
    >
      {children}
      {mounted
        ? createPortal(
            <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
              {toasts.map((t) => (
                <div
                  key={t.id}
                  role="status"
                  className="animate-toast-in flex items-start gap-3 rounded-xl border border-line bg-surface p-3 shadow-lg"
                >
                  {t.kind === 'success' ? (
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brand-forest" />
                  ) : (
                    <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
                  )}
                  <p className="min-w-0 flex-1 text-sm text-ink">{t.text}</p>
                  <button
                    onClick={() => dismiss(t.id)}
                    className="shrink-0 rounded p-0.5 text-muted transition hover:bg-paper hover:text-ink"
                    aria-label="Cerrar notificación"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  )
}