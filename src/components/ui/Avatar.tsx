'use client'

import { getInitials } from '@/lib/utils'

interface AvatarProps {
  name: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'w-8 h-8 text-[10px]',
  md: 'w-10 h-10 text-xs',
  lg: 'w-14 h-14 text-base',
}

const bgColors = [
  'bg-accent/10 text-accent',
  'bg-amber-500/10 text-amber-400',
  'bg-emerald-500/10 text-emerald-400',
  'bg-blue-500/10 text-blue-400',
  'bg-rose-500/10 text-rose-400',
  'bg-purple-500/10 text-purple-400',
]

function getColorFromName(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return bgColors[Math.abs(hash) % bgColors.length]
}

export function Avatar({ name, src, size = 'md' }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeMap[size]} rounded-lg object-cover ring-1 ring-surface-border`}
      />
    )
  }

  return (
    <div
      className={`${sizeMap[size]} ${getColorFromName(name)} rounded-lg font-mono font-bold flex items-center justify-center ring-1 ring-surface-border`}
    >
      {getInitials(name)}
    </div>
  )
}
