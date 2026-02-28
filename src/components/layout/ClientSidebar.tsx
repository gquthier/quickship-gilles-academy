'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderKanban,
  LifeBuoy,
  RefreshCw,
  CreditCard,
  Settings,
  LogOut,
  X,
  Sparkles,
  Layers,
  Plug,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Vue d\'ensemble', href: '/overview', icon: LayoutDashboard },
  { name: 'Mes projets', href: '/projects', icon: FolderKanban },
  { name: 'Modifications', href: '/updates', icon: RefreshCw },
  { name: 'Support', href: '/support', icon: LifeBuoy },
  { name: 'Assistant IA', href: '/assistant', icon: Sparkles },
  { name: 'Hub', href: '/hub', icon: Layers },
  { name: 'Integrations', href: '/integrations', icon: Plug },
  { name: 'Abonnements', href: '/subscriptions', icon: CreditCard },
  { name: 'Parametres', href: '/settings', icon: Settings },
]

interface ClientSidebarProps {
  user: { full_name: string; email: string; avatar_url?: string | null }
  onSignOut: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export function ClientSidebar({ user, onSignOut, mobileOpen, onMobileClose }: ClientSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 w-[260px] bg-bg border-r-3 border-surface-border flex flex-col z-50 transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b-3 border-surface-border">
          <Link
            href="/overview"
            className="flex items-center gap-2"
            onClick={onMobileClose}
          >
            <div className="w-7 h-7 bg-accent border-3 border-accent" />
            <span className="font-display font-black text-lg uppercase tracking-tight">
              <span className="text-accent">Quick</span>
              <span className="text-text-primary">Ship</span>
            </span>
          </Link>
          <button
            onClick={onMobileClose}
            className="p-1.5 border-3 border-surface-border text-text-muted hover:border-accent hover:text-accent md:hidden transition-all duration-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Label */}
        <div className="px-5 pt-5 pb-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-accent">
            Navigation
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pb-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-100',
                  isActive
                    ? 'bg-accent text-black border-3 border-accent'
                    : 'text-text-muted border-3 border-transparent hover:border-accent hover:text-accent'
                )}
              >
                <item.icon
                  className={cn(
                    'w-[18px] h-[18px]',
                    isActive ? 'text-black' : 'text-text-muted'
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className="border-t-3 border-surface-border px-4 py-4">
          <div className="flex items-center gap-3">
            <Avatar name={user.full_name} src={user.avatar_url} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-text-primary truncate">
                {user.full_name}
              </p>
              <p className="text-[11px] text-text-muted font-mono truncate">{user.email}</p>
            </div>
            <button
              onClick={onSignOut}
              className="btn-danger !px-2 !py-2 !text-xs"
              title="Se deconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
