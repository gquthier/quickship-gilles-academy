'use client'

import { Bell, Search, Menu } from 'lucide-react'

interface TopBarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  onMenuToggle?: () => void
}

export function TopBar({ title, subtitle, actions, onMenuToggle }: TopBarProps) {
  return (
    <header className="h-14 md:h-16 bg-bg/80 backdrop-blur-xl border-b border-surface-border flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu button */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="p-2 -ml-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover md:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="font-display font-extrabold text-base md:text-[18px] tracking-[-0.02em] text-text-primary truncate">
            {title}
          </h1>
          {subtitle && <p className="text-[11px] md:text-[12px] text-text-muted mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        {/* Search - hidden on mobile */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="pl-10 pr-4 py-2 md:py-2.5 rounded-lg bg-surface border border-surface-border text-[13px] text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/40 w-40 md:w-56 transition-all duration-200 placeholder:text-text-muted"
          />
        </div>
        {/* Notifications */}
        <button className="relative p-2 md:p-2.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-all duration-200">
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full ring-2 ring-bg" />
        </button>
        {/* Custom actions */}
        {actions}
      </div>
    </header>
  )
}
