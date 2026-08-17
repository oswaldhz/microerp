export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando">
      <div className="animate-pulse space-y-2">
        <div className="h-6 w-48 rounded-md bg-brand-mint/60" />
        <div className="h-4 w-72 rounded-md bg-brand-mint/40" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-line bg-surface p-4">
            <div className="mb-3 h-4 w-24 rounded-md bg-brand-mint/40" />
            <div className="h-7 w-32 rounded-md bg-brand-mint/60" />
          </div>
        ))}
      </div>

      <div className="animate-pulse rounded-xl border border-line bg-surface p-6">
        <div className="mb-4 h-4 w-40 rounded-md bg-brand-mint/40" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 rounded-md bg-brand-mint/30" style={{ width: `${100 - i * 8}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}