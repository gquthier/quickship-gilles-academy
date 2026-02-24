'use client'

import { type LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: { value: number; positive: boolean }
  color?: string
}

export function StatCard({ label, value, icon: Icon, trend, color = 'purple' }: StatCardProps) {
  const colorMap: Record<string, string> = {
    purple: 'bg-purple-50 text-purple',
    teal: 'bg-teal-50 text-teal',
    coral: 'bg-orange-50 text-coral',
    green: 'bg-green-50 text-accent-green',
    blue: 'bg-blue-50 text-accent-blue',
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{label}</p>
          <p className="text-2xl font-display font-bold text-slate-900">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 ${trend.positive ? 'text-accent-green' : 'text-accent-red'}`}>
              {trend.positive ? '+' : ''}{trend.value}% vs mois dernier
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${colorMap[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}
