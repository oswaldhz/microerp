'use client'

import { useBranding } from '@/lib/use-branding'
import Avatar from '@/components/Avatar'

export default function HeaderUser({ name, email }: { name: string; email: string }) {
  const { branding } = useBranding()
  return (
    <div className="flex items-center gap-3">
      <Avatar src={branding.avatar} name={name} size={32} />
      <div className="text-sm font-medium text-muted">
        {name} · {email}
      </div>
    </div>
  )
}