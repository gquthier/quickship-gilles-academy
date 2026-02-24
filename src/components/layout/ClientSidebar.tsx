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
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Vue d\'ensemble', href: '/overview', icon: LayoutDashboard },
  { name: 'Mes projets', href: '/projects', icon: FolderKanban },
  { name: 'Modifications', href: '/updates', icon: RefreshCw },
  { name: 'Support', href: '/support', icon: LifeBuoy },
  { name: 'Abonnements', href: '/subscriptions', icon: CreditCard },
  { name: 'Paramètres', href: '/settings', icon: Settings },
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 w-[260px] bg-bg border-r border-surface-border flex flex-col z-50 transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-7 border-b border-surface-border">
          <Link
            href="/overview"
            className="font-display font-extrabold text-[22px] tracking-[-0.04em]"
            onClick={onMobileClose}
          >
            <span className="text-accent">Quick</span>
            <span className="text-white">Ship</span>
          </Link>
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200',
                  isActive
                    ? 'text-accent bg-accent/10 border-l-2 border-accent font-semibold'
                    : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
                )}
              >
                <item.icon
                  className={cn(
                    'w-[18px] h-[18px]',
                    isActive ? 'text-accent' : 'text-text-muted'
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className="border-t border-surface-border px-4 py-4">
          <div className="flex items-center gap-3">
            <Avatar name={user.full_name} src={user.avatar_url} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-text-primary truncate">
                {user.full_name}
              </p>
              <p className="text-[11px] text-text-muted truncate">{user.email}</p>
            </div>
            <button
              onClick={onSignOut}
              className="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-surface-hover transition-all duration-200"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
