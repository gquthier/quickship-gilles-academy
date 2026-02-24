'use client'

import { type LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: { value: number; positive: boolean }
  color?: 'accent' | 'emerald' | 'blue' | 'red' | 'amber' | 'purple'
}

const colorMap = {
  accent: { bg: 'bg-accent/10', icon: 'text-accent/80' },
  emerald: { bg: 'bg-emerald-500/10', icon: 'text-emerald-500/80' },
  blue: { bg: 'bg-blue-500/10', icon: 'text-blue-500/80' },
  red: { bg: 'bg-red-500/10', icon: 'text-red-500/80' },
  amber: { bg: 'bg-amber-500/10', icon: 'text-amber-500/80' },
  purple: { bg: 'bg-purple-500/10', icon: 'text-purple-500/80' },
}

export function StatCard({ label, value, icon: Icon, trend, color = 'accent' }: StatCardProps) {
  const c = colorMap[color]

  return (
    <div className="bg-surface/60 backdrop-blur-xl border border-surface-border rounded-xl p-5 group hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary font-body mb-1.5">{label}</p>
          <p className="text-3xl font-display font-extrabold tracking-tight text-text-primary">
            {value}
          </p>
          {trend && (
            <p
              className={`text-xs font-semibold mt-2 flex items-center gap-1 ${
                trend.positive ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              <span
                className={`inline-block w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent ${
                  trend.positive
                    ? 'border-b-[5px] border-b-emerald-400'
                    : 'border-t-[5px] border-t-red-400'
                }`}
              />
              {trend.positive ? '+' : ''}
              {trend.value}%
              <span className="text-text-muted font-normal">vs mois dernier</span>
            </p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
        >
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
      </div>
    </div>
  )
}
