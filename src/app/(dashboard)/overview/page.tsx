'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { TopBar } from '@/components/layout/TopBar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDistanceToNow } from '@/lib/utils'
import {
  FolderKanban,
  LifeBuoy,
  RefreshCw,
  ArrowRight,
  MessageSquare,
  Zap,
  TrendingUp,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import type { Project, SupportTicket, UpdateRequest } from '@/types'
import { useMobileMenu } from '@/context/mobile-menu'

const statusProgress: Record<string, number> = {
  draft: 5,
  in_progress: 40,
  review: 75,
  deployed: 95,
  maintenance: 100,
  paused: 40,
  archived: 100,
}

const statusProgressColor: Record<string, string> = {
  draft: 'bg-blue-400',
  in_progress: 'bg-amber-400',
  review: 'bg-purple-400',
  deployed: 'bg-emerald-400',
  maintenance: 'bg-blue-400',
  paused: 'bg-amber-400',
  archived: 'bg-text-muted',
}

type ActivityItem =
  | { type: 'ticket'; id: string; label: string; date: string; href: string }
  | { type: 'update'; id: string; label: string; date: string; href: string }
  | { type: 'project'; id: string; label: string; date: string; href: string }

export default function OverviewPage() {
  const onMenuToggle = useMobileMenu()
  const [projects, setProjects] = useState<Project[]>([])
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [updates, setUpdates] = useState<UpdateRequest[]>([])
  const [firstName, setFirstName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const [projectsRes, ticketsRes, updatesRes, profileRes] = await Promise.all([
        supabase.from('projects').select('*').eq('client_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('support_tickets').select('*').eq('client_id', session.user.id).order('created_at', { ascending: false }).limit(8),
        supabase.from('update_requests').select('*').eq('client_id', session.user.id).order('created_at', { ascending: false }).limit(8),
        supabase.from('profiles').select('full_name').eq('id', session.user.id).single(),
      ])

      setProjects(projectsRes.data || [])
      setTickets(ticketsRes.data || [])
      setUpdates(updatesRes.data || [])

      if (profileRes.data?.full_name) {
        setFirstName(profileRes.data.full_name.split(' ')[0] ?? '')
      }

      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-[3px] border-surface-border border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  const activeProjects = projects.filter(p => ['in_progress', 'review', 'deployed', 'maintenance'].includes(p.status))
  const openTickets = tickets.filter(t => !['resolved', 'closed'].includes(t.status))
  const pendingUpdates = updates.filter(u => !['completed', 'rejected'].includes(u.status))
  const globalProgress = projects.length > 0
    ? Math.round((activeProjects.length / projects.length) * 100)
    : 0

  // Build activity feed
  const activityItems: ActivityItem[] = [
    ...tickets.map(t => ({
      type: 'ticket' as const,
      id: t.id,
      label: t.subject,
      date: t.created_at,
      href: `/support/${t.id}`,
    })),
    ...updates.map(u => ({
      type: 'update' as const,
      id: u.id,
      label: u.title,
      date: u.created_at,
      href: '/updates',
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1)

  return (
    <>
      <TopBar title="Vue d'ensemble" subtitle="Bienvenue sur votre espace QuickShip" onMenuToggle={onMenuToggle} />

      <div className="p-4 md:p-8 space-y-6 md:space-y-8">

        {/* Hero */}
        <div className="card relative overflow-hidden">
          {/* Grid overlay */}
          <div className="absolute inset-0 grid-overlay opacity-50 pointer-events-none" />
          <div className="relative z-10">
            <p className="text-xs text-text-muted mb-1 font-mono">{todayCapitalized}</p>
            <h1 className="font-display font-extrabold text-3xl md:text-[40px] tracking-tight text-text-primary leading-none mb-2">
              Bonjour{firstName ? `, ${firstName}` : ''} 👋
            </h1>
            <p className="text-text-secondary text-sm md:text-base mb-6">
              Voici l&apos;&eacute;tat de vos projets aujourd&apos;hui
            </p>
            {/* Global progress bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-muted font-mono">Projets actifs</span>
                <span className="text-xs font-bold text-accent font-mono">{activeProjects.length}/{projects.length}</span>
              </div>
              <div className="h-1.5 bg-surface-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-700"
                  style={{ width: `${globalProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          {/* Projets */}
          <div className="card border-accent/20 hover:border-accent/40 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-accent" />
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-400 font-mono">
                <TrendingUp className="w-3.5 h-3.5" />
                actifs
              </div>
            </div>
            <p className="font-display font-extrabold text-3xl text-text-primary mb-0.5">{activeProjects.length}</p>
            <p className="text-xs text-text-muted">projets actifs sur {projects.length}</p>
          </div>

          {/* Tickets */}
          <div className="card border-red-500/20 hover:border-red-500/40 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <LifeBuoy className="w-5 h-5 text-red-400" />
              </div>
              {openTickets.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-red-400 font-mono">
                  <Zap className="w-3.5 h-3.5" />
                  ouverts
                </div>
              )}
            </div>
            <p className="font-display font-extrabold text-3xl text-text-primary mb-0.5">{openTickets.length}</p>
            <p className="text-xs text-text-muted">tickets ouverts</p>
          </div>

          {/* Modifications */}
          <div className="card border-blue-500/20 hover:border-blue-500/40 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-blue-400" />
              </div>
              {pendingUpdates.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-blue-400 font-mono">
                  <Zap className="w-3.5 h-3.5" />
                  en cours
                </div>
              )}
            </div>
            <p className="font-display font-extrabold text-3xl text-text-primary mb-0.5">{pendingUpdates.length}</p>
            <p className="text-xs text-text-muted">modifications en cours</p>
          </div>
        </div>

        {/* Projects section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg">Projets actifs</h2>
            <Link href="/projects" className="text-sm text-accent font-medium hover:text-accent-hover flex items-center gap-1">
              Voir tous <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="card text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <FolderKanban className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">Aucun projet</h3>
              <p className="text-text-muted text-sm mb-6">Votre premier projet n&apos;a pas encore &eacute;t&eacute; cr&eacute;&eacute;.</p>
              <Link href="/support/new" className="btn-primary text-sm mx-auto inline-flex">
                Contacter l&apos;&eacute;quipe
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.slice(0, 4).map((project) => {
                const progress = statusProgress[project.status] ?? 0
                const progressColor = statusProgressColor[project.status] ?? 'bg-text-muted'
                return (
                  <div key={project.id} className="card hover:border-text-muted hover:shadow-card-hover transition-all duration-200 flex flex-col">
                    {/* Top: badge */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                        <FolderKanban className="w-4 h-4 text-accent" />
                      </div>
                      <StatusBadge status={project.status} />
                    </div>

                    {/* Name + description */}
                    <h3 className="font-display font-bold text-base text-text-primary mb-1">{project.name}</h3>
                    {project.description && (
                      <p className="text-sm text-text-secondary line-clamp-2 mb-3">{project.description}</p>
                    )}

                    {/* Tech stack tags */}
                    {project.tech_stack.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {project.tech_stack.slice(0, 4).map((t) => (
                          <span key={t} className="text-[11px] bg-surface-hover text-text-muted px-2 py-0.5 rounded-md font-mono border border-surface-border">{t}</span>
                        ))}
                        {project.tech_stack.length > 4 && (
                          <span className="text-[11px] text-text-muted px-2 py-0.5">+{project.tech_stack.length - 4}</span>
                        )}
                      </div>
                    )}

                    {/* Progress bar */}
                    <div className="mt-auto">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] text-text-muted font-mono">Progression</span>
                        <span className="text-[11px] font-bold text-text-secondary font-mono">{progress}%</span>
                      </div>
                      <div className="h-1 bg-surface-border rounded-full overflow-hidden mb-4">
                        <div
                          className={`h-full ${progressColor} rounded-full transition-all duration-700`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      {/* CTA */}
                      <Link
                        href={`/projects/${project.id}`}
                        className="btn-secondary w-full justify-between text-xs py-2.5"
                      >
                        Voir le projet
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Activity feed */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg">Derni&egrave;re activit&eacute;</h2>
          </div>

          {activityItems.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-sm text-text-muted">Aucune activit&eacute; r&eacute;cente</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="divide-y divide-surface-border">
                {activityItems.map((item) => {
                  const icon =
                    item.type === 'ticket' ? (
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-4 h-4 text-red-400" />
                      </div>
                    ) : item.type === 'update' ? (
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <RefreshCw className="w-4 h-4 text-blue-400" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <FolderKanban className="w-4 h-4 text-emerald-400" />
                      </div>
                    )

                  const typeLabel =
                    item.type === 'ticket' ? 'Ticket' :
                    item.type === 'update' ? 'Modification' : 'Projet'

                  return (
                    <Link
                      key={`${item.type}-${item.id}`}
                      href={item.href}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-hover transition-colors"
                    >
                      {icon}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{item.label}</p>
                        <p className="text-xs text-text-muted">{typeLabel}</p>
                      </div>
                      <span className="text-xs text-text-muted font-mono flex-shrink-0">
                        {formatDistanceToNow(new Date(item.date))}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  )
}
