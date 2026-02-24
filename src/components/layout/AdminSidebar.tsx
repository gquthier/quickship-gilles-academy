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
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/admin/clients', icon: Users },
  { name: 'Projets', href: '/admin/projects', icon: FolderKanban },
  { name: 'Support', href: '/admin/support', icon: LifeBuoy },
  { name: 'Onboarding', href: '/admin/onboarding', icon: ClipboardList },
  { name: 'Paramètres', href: '/admin/settings', icon: Settings },
]

interface AdminSidebarProps {
  user: { full_name: string; email: string; avatar_url?: string | null }
  onSignOut: () => void
}

export function AdminSidebar({ user, onSignOut }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 flex flex-col z-30">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <Link href="/admin/dashboard" className="font-display font-extrabold text-2xl tracking-tight">
          <span className="text-purple-light">Quick</span>
          <span className="text-white">Ship</span>
        </Link>
        <span className="ml-2 text-xs bg-purple/30 text-purple-light px-2 py-0.5 rounded-full font-semibold">
          Admin
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-purple/20 text-purple-light'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Admin Badge */}
      <div className="px-3 pb-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs">
          <Shield className="w-4 h-4 text-purple-light" />
          <span>Panneau d'administration</span>
        </div>
      </div>

      {/* User Profile */}
      <div className="border-t border-slate-800 p-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar name={user.full_name} src={user.avatar_url} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
          <button
            onClick={onSignOut}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
