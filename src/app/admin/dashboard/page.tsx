'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { TopBar } from '@/components/layout/TopBar'
import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { formatDate, formatDateTime } from '@/lib/utils'
import {
  Users,
  FolderKanban,
  LifeBuoy,
  CreditCard,
  Clock,
  TrendingUp,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import type { Project, SupportTicket, Profile } from '@/types'

interface DashboardData {
  totalClients: number
  totalProjects: number
  openTickets: number
  activeSubscriptions: number
  recentProjects: Project[]
  recentTickets: (SupportTicket & { client?: Profile })[]
  recentClients: Profile[]
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [
        { count: clientCount },
        { count: projectCount },
        { count: ticketCount },
        { count: subCount },
        { data: recentProjects },
        { data: recentTickets },
        { data: recentClients },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).not('status', 'in', '("resolved","closed")'),
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('projects').select('*, client:profiles(full_name, company)').order('created_at', { ascending: false }).limit(5),
        supabase.from('support_tickets').select('*, client:profiles(full_name, avatar_url)').order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('*').eq('role', 'client').order('created_at', { ascending: false }).limit(5),
      ])

      setData({
        totalClients: clientCount || 0,
        totalProjects: projectCount || 0,
        openTickets: ticketCount || 0,
        activeSubscriptions: subCount || 0,
        recentProjects: recentProjects || [],
        recentTickets: recentTickets || [],
        recentClients: recentClients || [],
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <TopBar title="Dashboard Admin" subtitle="Vue d'ensemble de votre activité" />

      <div className="p-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Clients" value={data.totalClients} icon={Users} color="purple" />
          <StatCard label="Projets" value={data.totalProjects} icon={FolderKanban} color="blue" />
          <StatCard label="Tickets ouverts" value={data.openTickets} icon={LifeBuoy} color="coral" />
          <StatCard label="Abonnements actifs" value={data.activeSubscriptions} icon={CreditCard} color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Projects */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg">Projets récents</h2>
              <Link href="/admin/projects" className="text-sm text-purple font-medium hover:underline flex items-center gap-1">
                Voir tous <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="card divide-y divide-slate-100">
              {data.recentProjects.map((project) => (
                <Link key={project.id} href={`/admin/projects/${project.id}`} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <FolderKanban className="w-5 h-5 text-purple" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-slate-900 truncate">{project.name}</h3>
                    <p className="text-xs text-slate-400">
                      {(project.client as any)?.full_name || 'Client'} · {formatDate(project.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={project.status} />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Clients */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg">Nouveaux clients</h2>
              <Link href="/admin/clients" className="text-sm text-purple font-medium hover:underline flex items-center gap-1">
                Voir tous <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="card space-y-3">
              {data.recentClients.map((client) => (
                <Link key={client.id} href={`/admin/clients/${client.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <Avatar name={client.full_name} src={client.avatar_url} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{client.full_name}</p>
                    <p className="text-xs text-slate-400 truncate">{client.company || client.email}</p>
                  </div>
                  <span className="text-xs text-slate-300">{formatDate(client.created_at)}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Open Tickets */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-coral" />
              Tickets à traiter
            </h2>
            <Link href="/admin/support" className="text-sm text-purple font-medium hover:underline flex items-center gap-1">
              Voir tous <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="card divide-y divide-slate-100">
            {data.recentTickets.filter(t => !['resolved', 'closed'].includes(t.status)).slice(0, 5).map((ticket) => (
              <Link key={ticket.id} href={`/admin/support/${ticket.id}`} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl">
                <Avatar name={(ticket.client as any)?.full_name || 'C'} src={(ticket.client as any)?.avatar_url} size="sm" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-slate-900 truncate">{ticket.subject}</h3>
                  <p className="text-xs text-slate-400">
                    {(ticket.client as any)?.full_name} · {formatDateTime(ticket.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={ticket.priority} />
                  <StatusBadge status={ticket.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
