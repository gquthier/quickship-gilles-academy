'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { TopBar } from '@/components/layout/TopBar'
import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { ActivityChart } from '@/components/ui/ActivityChart'
import { formatDate, formatDateTime, formatEur } from '@/lib/utils'
import {
  Users,
  FolderKanban,
  LifeBuoy,
  CreditCard,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Euro,
  BarChart3,
  Receipt,
  Activity,
} from 'lucide-react'
import Link from 'next/link'
import { useAdminMobileMenu } from '@/context/admin-mobile-menu'
import type { Project, SupportTicket, Profile, StripeData } from '@/types'

interface DashboardData {
  totalClients: number
  totalProjects: number
  openTickets: number
  activeSubscriptions: number
  recentProjects: Project[]
  recentTickets: (SupportTicket & { client?: Profile })[]
  recentClients: Profile[]
  allClients: { created_at: string }[]
  allProjects: { created_at: string }[]
}

// Build 12-week activity chart data from a list of {created_at} items
function buildWeeklyChart(items: { created_at: string }[]): { label: string; value: number }[] {
  const now = new Date()
  const weeks: { label: string; value: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - i * 7 - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    const count = items.filter(item => {
      const d = new Date(item.created_at)
      return d >= weekStart && d < weekEnd
    }).length

    const month = weekStart.toLocaleDateString('fr-FR', { month: 'short' })
    const day = weekStart.getDate()
    weeks.push({ label: `${day} ${month}`, value: count })
  }
  return weeks
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [stripeData, setStripeData] = useState<StripeData | null>(null)
  const [stripeLoading, setStripeLoading] = useState(true)
  const onMenuToggle = useAdminMobileMenu()
  const supabase = createClient()

  const clientActivityData = useMemo(() => {
    if (!data?.allClients) return []
    return buildWeeklyChart(data.allClients)
  }, [data?.allClients])

  const projectActivityData = useMemo(() => {
    if (!data?.allProjects) return []
    return buildWeeklyChart(data.allProjects)
  }, [data?.allProjects])

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
        { data: allClients },
        { data: allProjects },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).not('status', 'in', '("resolved","closed")'),
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('projects').select('*, client:profiles(full_name, company)').order('created_at', { ascending: false }).limit(5),
        supabase.from('support_tickets').select('*, client:profiles(full_name, avatar_url)').order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('*').eq('role', 'client').order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('created_at').eq('role', 'client'),
        supabase.from('projects').select('created_at'),
      ])

      setData({
        totalClients: clientCount || 0,
        totalProjects: projectCount || 0,
        openTickets: ticketCount || 0,
        activeSubscriptions: subCount || 0,
        recentProjects: recentProjects || [],
        recentTickets: recentTickets || [],
        recentClients: recentClients || [],
        allClients: allClients || [],
        allProjects: allProjects || [],
      })
      setLoading(false)
    }

    async function loadStripe() {
      try {
        const res = await fetch('/api/admin/stripe')
        if (res.ok) {
          setStripeData(await res.json())
        }
      } catch {
        // Stripe data non-critical
      } finally {
        setStripeLoading(false)
      }
    }

    load()
    loadStripe()
  }, [])

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-[3px] border-surface-border border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <TopBar title="Dashboard Admin" subtitle="Vue d'ensemble de votre activité" onMenuToggle={onMenuToggle} />

      <div className="p-4 md:p-8 space-y-4 md:space-y-8">
        {/* Revenue Stats */}
        <div>
          <h2 className="font-display font-bold text-lg flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-accent" />
            Revenus Stripe
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {stripeLoading ? (
              <>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-surface/60 backdrop-blur-xl border border-surface-border rounded-xl p-5 animate-pulse">
                    <div className="h-4 w-24 bg-surface-border rounded mb-3" />
                    <div className="h-8 w-32 bg-surface-border rounded" />
                  </div>
                ))}
              </>
            ) : stripeData ? (
              <>
                <StatCard
                  label="CA ce mois"
                  value={formatEur(stripeData.revenue.thisMonth)}
                  icon={Euro}
                  color="accent"
                  trend={stripeData.revenue.trend !== null ? { value: Math.abs(stripeData.revenue.trend), positive: stripeData.revenue.trend >= 0 } : undefined}
                />
                <StatCard label="CA mois dernier" value={formatEur(stripeData.revenue.lastMonth)} icon={Receipt} color="blue" />
                <StatCard label="CA cette semaine" value={formatEur(stripeData.revenue.thisWeek)} icon={TrendingUp} color="purple" />
                <StatCard label="MRR" value={formatEur(stripeData.revenue.mrr)} icon={BarChart3} color="emerald" />
              </>
            ) : (
              <div className="col-span-full text-center py-4 text-text-muted text-sm">
                Données Stripe indisponibles
              </div>
            )}
          </div>
        </div>

        {/* CRM Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <StatCard label="Clients" value={data.totalClients} icon={Users} color="accent" />
          <StatCard label="Projets" value={data.totalProjects} icon={FolderKanban} color="blue" />
          <StatCard label="Tickets ouverts" value={data.openTickets} icon={LifeBuoy} color="red" />
          <StatCard label="Abonnements actifs" value={data.activeSubscriptions} icon={CreditCard} color="emerald" />
        </div>

        {/* Activity Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent" />
                Nouveaux clients
              </h2>
              <span className="text-xs text-text-muted">12 semaines</span>
            </div>
            {clientActivityData.length > 0 ? (
              <ActivityChart data={clientActivityData} color="#CCFF00" height={72} />
            ) : (
              <div className="h-24 flex items-center justify-center text-xs text-text-muted">Pas de données</div>
            )}
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                Nouveaux projets
              </h2>
              <span className="text-xs text-text-muted">12 semaines</span>
            </div>
            {projectActivityData.length > 0 ? (
              <ActivityChart data={projectActivityData} color="#60a5fa" height={72} />
            ) : (
              <div className="h-24 flex items-center justify-center text-xs text-text-muted">Pas de données</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Recent Projects */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg">Projets récents</h2>
              <Link href="/admin/projects" className="text-sm text-accent font-medium hover:text-accent-hover flex items-center gap-1">
                Voir tous <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="card divide-y divide-surface-border">
              {data.recentProjects.map((project) => (
                <Link key={project.id} href={`/admin/projects/${project.id}`} className="flex items-center gap-4 p-4 hover:bg-surface-hover transition-colors first:rounded-t-2xl last:rounded-b-2xl">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <FolderKanban className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-text-primary truncate">{project.name}</h3>
                    <p className="text-xs text-text-muted">
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
              <Link href="/admin/clients" className="text-sm text-accent font-medium hover:text-accent-hover flex items-center gap-1">
                Voir tous <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="card space-y-3">
              {data.recentClients.map((client) => (
                <Link key={client.id} href={`/admin/clients/${client.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-hover transition-colors">
                  <Avatar name={client.full_name} src={client.avatar_url} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{client.full_name}</p>
                    <p className="text-xs text-text-muted truncate">{client.company || client.email}</p>
                  </div>
                  <span className="text-xs text-text-muted">{formatDate(client.created_at)}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        {stripeData && stripeData.recentPayments.length > 0 && (
          <div>
            <h2 className="font-display font-bold text-lg flex items-center gap-2 mb-4">
              <Receipt className="w-5 h-5 text-emerald-400" />
              Revenus récents
            </h2>
            <div className="card divide-y divide-surface-border">
              {stripeData.recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center gap-4 p-4 first:rounded-t-2xl last:rounded-b-2xl">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <Euro className="w-5 h-5 text-emerald-500/80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-text-primary truncate">{payment.customerName}</h3>
                    <p className="text-xs text-text-muted">
                      {formatDateTime(new Date(payment.created * 1000))}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-400">{formatEur(payment.amount)}</span>
                  <span className="badge-success text-xs px-2 py-0.5 rounded-full">Payé</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customer Spending */}
        {stripeData && stripeData.customerSpending.length > 0 && (
          <div>
            <h2 className="font-display font-bold text-lg flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-blue-400" />
              Clients & Paiements
            </h2>
            <div className="card divide-y divide-surface-border">
              {stripeData.customerSpending.map((customer, i) => (
                <div key={i} className="flex items-center gap-4 p-4 first:rounded-t-2xl last:rounded-b-2xl">
                  <Avatar name={customer.matchedProfileName || customer.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-text-primary truncate">
                        {customer.matchedProfileName || customer.name}
                      </h3>
                      {customer.matchedProfileName && (
                        <span className="badge-info text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0">Client QuickShip</span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted truncate">
                      {customer.email || 'Email inconnu'} · {customer.chargeCount} paiement{customer.chargeCount > 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-text-primary">{formatEur(customer.totalSpent)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Open Tickets */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-400" />
              Tickets à traiter
            </h2>
            <Link href="/admin/support" className="text-sm text-accent font-medium hover:text-accent-hover flex items-center gap-1">
              Voir tous <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="card divide-y divide-surface-border">
            {data.recentTickets.filter(t => !['resolved', 'closed'].includes(t.status)).slice(0, 5).map((ticket) => (
              <Link key={ticket.id} href={`/admin/support/${ticket.id}`} className="flex items-center gap-4 p-4 hover:bg-surface-hover transition-colors first:rounded-t-2xl last:rounded-b-2xl">
                <Avatar name={(ticket.client as any)?.full_name || 'C'} src={(ticket.client as any)?.avatar_url} size="sm" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-text-primary truncate">{ticket.subject}</h3>
                  <p className="text-xs text-text-muted">
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
