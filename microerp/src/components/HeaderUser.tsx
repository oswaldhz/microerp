'use client'

import Avatar from '@/components/Avatar'

export default function HeaderUser({ name, email }: { name: string; email: string }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} size={32} />
      <div className="text-sm font-medium text-muted">
        {name} · {email}
      </div>
    </div>
  )
}