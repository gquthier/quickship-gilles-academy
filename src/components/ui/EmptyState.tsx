'use client'

import { type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-20 h-20 rounded-full bg-purple-50 ring-1 ring-purple-100 flex items-center justify-center mb-5">
        <Icon className="w-9 h-9 text-purple-400" />
      </div>
      <h3 className="font-display font-bold text-lg text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm text-center max-w-sm mb-8 leading-relaxed">{description}</p>
      {action}
    </div>
  )
}
