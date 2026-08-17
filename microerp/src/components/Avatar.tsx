'use client'

export default function Avatar({
  src,
  name,
  size = 32,
}: {
  src: string | null
  name: string
  size?: number
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-mint font-semibold text-brand-forest"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {initials || '?'}
    </span>
  )
}