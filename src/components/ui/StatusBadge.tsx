'use client'

import { getStatusColor, getStatusLabel } from '@/lib/utils'

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={getStatusColor(status)}>
      {getStatusLabel(status)}
    </span>
  )
}
