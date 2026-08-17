'use client'

import { HelpCircle } from 'lucide-react'
import Tooltip from '@/components/Tooltip'

/**
 * Compact page header: title + action buttons, with a ?-icon tooltip
 * that explains what the page is for. No banners, no layout shift.
 */
export default function PageHeader({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <h1 className="font-display text-2xl font-bold tracking-tight text-brand-ink">{title}</h1>
        <Tooltip label={description}>
          <span className="flex h-6 w-6 items-center justify-center rounded-full text-muted transition hover:bg-brand-mint hover:text-brand-forest">
            <HelpCircle size={15} aria-hidden />
          </span>
        </Tooltip>
      </div>
      {children}
    </div>
  )
}