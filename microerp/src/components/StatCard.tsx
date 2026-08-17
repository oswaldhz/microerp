import type { LucideIcon } from 'lucide-react'

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = 'leaf',
}: {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  accent?: 'leaf' | 'forest' | 'amber' | 'red' | 'sky'
}) {
  const accents: Record<string, string> = {
    leaf: 'bg-brand-mint text-brand-leaf',
    forest: 'bg-brand-forest text-brand-mint',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    sky: 'bg-sky-50 text-sky-600',
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="tnum mt-1 text-2xl font-bold tracking-tight text-ink">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accents[accent]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}