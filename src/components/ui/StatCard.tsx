'use client'

import { type LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: { value: number; positive: boolean }
  color?: 'purple' | 'amber' | 'emerald' | 'blue' | 'rose' | 'teal'
}

const colorMap = {
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', ring: 'ring-purple-100' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', ring: 'ring-amber-100' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', ring: 'ring-emerald-100' },
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', ring: 'ring-blue-100' },
  rose: { bg: 'bg-rose-50', icon: 'text-rose-600', ring: 'ring-rose-100' },
  teal: { bg: 'bg-teal-50', icon: 'text-teal-600', ring: 'ring-teal-100' },
}

export function StatCard({ label, value, icon: Icon, trend, color = 'purple' }: StatCardProps) {
  const c = colorMap[color]

  return (
    <div className="card group hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-body mb-1.5">{label}</p>
          <p className="text-3xl font-display font-extrabold tracking-tight text-gray-900">{value}</p>
          {trend && (
            <p className={`text-xs font-semibold mt-2 flex items-center gap-1 ${trend.positive ? 'text-emerald-600' : 'text-red-500'}`}>
              <span className={`inline-block w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent ${trend.positive ? 'border-b-[5px] border-b-emerald-600' : 'border-t-[5px] border-t-red-500'}`} />
              {trend.positive ? '+' : ''}{trend.value}%
              <span className="text-gray-400 font-normal">vs mois dernier</span>
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-2xl ${c.bg} ring-1 ${c.ring} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
      </div>
    </div>
  )
}
