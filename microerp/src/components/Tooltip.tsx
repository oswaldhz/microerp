'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type Side = 'top' | 'bottom' | 'right'

/**
 * Hover/focus guidance rendered via portal to <body>: escapes overflow
 * containers (sidebar scroll, tables) and always paints above other content.
 */
export default function Tooltip({
  label,
  children,
  side = 'top',
  className,
}: {
  label: string
  children: React.ReactNode
  side?: Side
  className?: string
}) {
  const id = useId()
  const triggerRef = useRef<HTMLSpanElement>(null)
  const tipRef = useRef<HTMLSpanElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number; side: Side } | null>(null)

  const show = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    let top: number
    let left: number
    if (side === 'right') {
      top = r.top + r.height / 2
      left = r.right + 8
    } else if (side === 'bottom') {
      top = r.bottom + 8
      left = r.left + r.width / 2
    } else {
      top = r.top - 8
      left = r.left + r.width / 2
    }
    setPos({ top, left, side })
  }, [side])

  const hide = useCallback(() => setPos(null), [])

  // Clamp within the viewport once the tooltip is measurable.
  useEffect(() => {
    if (!pos || !tipRef.current) return
    const rect = tipRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    let { top, left } = pos
    let changed = false
    if (left + rect.width > vw - 8) {
      left = vw - rect.width - 8
      changed = true
    }
    if (left < 8) {
      left = 8
      changed = true
    }
    if (top + rect.height > vh - 8) {
      top = vh - rect.height - 8
      changed = true
    }
    if (top < 8) {
      top = 8
      changed = true
    }
    if (changed) setPos({ top, left, side: pos.side })
  }, [pos])

  // Hide on scroll/resize so the tooltip never floats detached from its trigger.
  useEffect(() => {
    if (!pos) return
    const onScroll = () => hide()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', hide)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', hide)
    }
  }, [pos, hide])

  return (
    <span
      ref={triggerRef}
      aria-describedby={id}
      className={`relative inline-flex ${className ?? ''}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {pos &&
        createPortal(
          <span
            ref={tipRef}
            role="tooltip"
            id={id}
            className="pointer-events-none fixed z-[100] w-max max-w-64 rounded-md bg-brand-ink px-2.5 py-1.5 text-xs font-medium text-white shadow-lg"
            style={{
              top: pos.top,
              left: pos.left,
              transform:
                pos.side === 'right'
                  ? 'translateY(-50%)'
                  : `translate(-50%, ${pos.side === 'top' ? '-100%' : '0'})`,
            }}
          >
            {label}
          </span>,
          document.body,
        )}
    </span>
  )
}