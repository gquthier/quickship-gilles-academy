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
      <div className="w-20 h-20 rounded-xl bg-surface border border-surface-border flex items-center justify-center mb-5">
        <Icon className="w-9 h-9 text-text-muted" />
      </div>
      <h3 className="font-display font-bold text-lg text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary text-sm text-center max-w-sm mb-8 leading-relaxed">
        {description}
      </p>
      {action}
    </div>
  )
}
