'use client'

import { Search, Menu } from 'lucide-react'
import { NotificationBell } from '@/components/ui/NotificationBell'

interface TopBarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  onMenuToggle?: () => void
  showNotifications?: boolean
}

export function TopBar({ title, subtitle, actions, onMenuToggle, showNotifications = true }: TopBarProps) {
  return (
    <header className="h-14 md:h-16 bg-bg border-b-3 border-surface-border flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu button */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="p-2 -ml-2 border-3 border-surface-border text-text-muted hover:border-accent hover:text-accent md:hidden transition-all duration-100"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="font-display font-black text-base md:text-lg uppercase tracking-tight text-text-primary truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] md:text-[12px] text-text-muted font-mono mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        {/* Search - hidden on mobile */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="RECHERCHER..."
            className="input !pl-10 !pr-4 !py-2 md:!py-2.5 !text-xs !font-bold !uppercase !tracking-wider w-40 md:w-56"
          />
        </div>
        {/* Notifications bell (real-time) */}
        {showNotifications && <NotificationBell />}
        {/* Custom actions */}
        {actions}
      </div>
    </header>
  )
}
