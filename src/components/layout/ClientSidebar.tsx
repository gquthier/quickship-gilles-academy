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
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Vue d\'ensemble', href: '/overview', icon: LayoutDashboard },
  { name: 'Mes projets', href: '/projects', icon: FolderKanban },
  { name: 'Demandes de modif.', href: '/updates', icon: RefreshCw },
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
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex flex-col z-30">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <Logo />
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
                  ? 'bg-purple-50 text-purple'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* AI Assistant Button */}
      <div className="px-3 pb-3">
        <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-purple to-purple-dark text-white text-sm font-semibold hover:opacity-90 transition-opacity">
          <MessageSquare className="w-5 h-5" />
          Assistant IA
          <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">Beta</span>
        </button>
      </div>

      {/* User Profile */}
      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar name={user.full_name} src={user.avatar_url} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user.full_name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
          <button
            onClick={onSignOut}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
