'use client'

import { Bell, Search } from 'lucide-react'

interface TopBarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <header className="h-[72px] bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-20">
      <div>
        <h1 className="font-display font-extrabold text-[18px] tracking-[-0.02em] text-gray-900">{title}</h1>
        {subtitle && <p className="text-[12px] text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="pl-10 pr-4 py-2.5 rounded-full bg-gray-50 border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 w-56 transition-all duration-200 placeholder:text-gray-400"
          />
        </div>
        {/* Notifications */}
        <button className="relative p-2.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all duration-200">
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>
        {/* Custom actions */}
        {actions}
      </div>
    </header>
  )
}
