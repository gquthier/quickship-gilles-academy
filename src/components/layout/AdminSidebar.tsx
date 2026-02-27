'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  LifeBuoy,
  ClipboardList,
  Settings,
  LogOut,
  Shield,
  X,
  Sparkles,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/admin/clients', icon: Users },
  { name: 'Projets', href: '/admin/projects', icon: FolderKanban },
  { name: 'Support', href: '/admin/support', icon: LifeBuoy },
  { name: 'Onboarding', href: '/admin/onboarding', icon: ClipboardList },
  { name: 'Assistant IA', href: '/admin/ai-assistant', icon: Sparkles, highlight: true },
  { name: 'Paramètres', href: '/admin/settings', icon: Settings },
]

interface AdminSidebarProps {
  user: { full_name: string; email: string; avatar_url?: string | null }
  onSignOut: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export function AdminSidebar({ user, onSignOut, mobileOpen, onMobileClose }: AdminSidebarProps) {
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
        {/* Logo + Admin Badge */}
        <div className="h-16 flex items-center justify-between px-7 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/dashboard"
              className="font-display font-extrabold text-[22px] tracking-[-0.04em]"
              onClick={onMobileClose}
            >
              <span className="text-accent">Quick</span>
              <span className="text-white">Ship</span>
            </Link>
            <span className="text-[10px] font-mono font-bold tracking-wider bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded-md">
              ADMIN
            </span>
          </div>
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
                    ? 'text-accent bg-accent/10 font-semibold'
                    : (item as any).highlight && !isActive
                    ? 'text-accent/70 hover:text-accent hover:bg-accent/5 border border-accent/10 hover:border-accent/20'
                    : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
                )}
              >
                <item.icon
                  className={cn(
                    'w-[18px] h-[18px]',
                    isActive ? 'text-accent' : (item as any).highlight ? 'text-accent/70' : 'text-text-muted'
                  )}
                />
                {item.name}
                {(item as any).highlight && !isActive && (
                  <span className="ml-auto text-[9px] font-bold tracking-wider bg-accent/10 text-accent px-1.5 py-0.5 rounded">
                    NEW
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Admin Badge */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-accent/20 text-accent/60 text-[11px]">
            <Shield className="w-3.5 h-3.5 text-accent/60" />
            <span className="font-mono">Panneau d&apos;administration</span>
          </div>
        </div>

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
