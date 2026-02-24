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
    <aside className="fixed left-0 top-0 bottom-0 w-[260px] flex flex-col z-30 bg-gradient-to-b from-gray-900 via-gray-900 to-purple-950 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-purple-600/[0.07]" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-purple-500/[0.05]" />

      {/* Logo */}
      <div className="h-[72px] flex items-center gap-2.5 px-7 border-b border-white/[0.06] relative z-10">
        <Link href="/admin/dashboard" className="font-display font-extrabold text-[22px] tracking-[-0.04em]">
          <span className="text-purple-400">Quick</span>
          <span className="text-white">Ship</span>
        </Link>
        <span className="text-[10px] bg-purple-500/30 text-purple-300 px-2.5 py-1 rounded-full font-display font-bold tracking-wide">
          ADMIN
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto relative z-10">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200',
                isActive
                  ? 'bg-purple-500/20 text-purple-300 font-semibold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.05]'
              )}
            >
              <item.icon className={cn('w-[18px] h-[18px]', isActive ? 'text-purple-400' : 'text-gray-500')} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Admin Badge */}
      <div className="px-4 pb-3 relative z-10">
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-gray-400 text-[11px]">
          <Shield className="w-3.5 h-3.5 text-purple-400" />
          <span>Panneau d'administration</span>
        </div>
      </div>

      {/* User Profile */}
      <div className="border-t border-white/[0.06] px-4 py-4 relative z-10">
        <div className="flex items-center gap-3">
          <Avatar name={user.full_name} src={user.avatar_url} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white truncate">{user.full_name}</p>
            <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
          </div>
          <button
            onClick={onSignOut}
            className="p-2 rounded-xl text-gray-600 hover:text-gray-300 hover:bg-white/[0.06] transition-all duration-200"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
