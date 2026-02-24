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
  MessageSquare,
  Zap,
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
}

export function ClientSidebar({ user, onSignOut }: ClientSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-white border-r border-gray-100 flex flex-col z-30">
      {/* Logo */}
      <div className="h-[72px] flex items-center px-7 border-b border-gray-50">
        <Link href="/overview" className="font-display font-extrabold text-[22px] tracking-[-0.04em]">
          <span className="text-purple-600">Quick</span>
          <span className="text-gray-900">Ship</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200',
                isActive
                  ? 'bg-purple-50 text-purple-700 font-semibold shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              )}
            >
              <item.icon className={cn('w-[18px] h-[18px]', isActive ? 'text-purple-600' : 'text-gray-400')} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* AI Assistant Button */}
      <div className="px-4 pb-4">
        <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 text-white text-[13px] font-display font-bold hover:shadow-glow-purple transition-all duration-300 relative overflow-hidden group">
          {/* Decorative circle */}
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/[0.06]" />
          <div className="absolute -bottom-4 -left-4 w-14 h-14 rounded-full bg-white/[0.04]" />
          <Zap className="w-[18px] h-[18px] text-amber-400 relative z-10 group-hover:scale-110 transition-transform" />
          <span className="relative z-10">Assistant IA</span>
          <span className="ml-auto relative z-10 text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
            Beta
          </span>
        </button>
      </div>

      {/* User Profile */}
      <div className="border-t border-gray-100 px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar name={user.full_name} src={user.avatar_url} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-gray-900 truncate">{user.full_name}</p>
            <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
          </div>
          <button
            onClick={onSignOut}
            className="p-2 rounded-xl text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
