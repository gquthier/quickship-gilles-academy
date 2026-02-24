'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { TopBar } from '@/components/layout/TopBar'
import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate } from '@/lib/utils'
import {
  FolderKanban,
  LifeBuoy,
  RefreshCw,
  Globe,
  ExternalLink,
  Github,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import type { Project, SupportTicket, UpdateRequest } from '@/types'

export default function OverviewPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [updates, setUpdates] = useState<UpdateRequest[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const [projectsRes, ticketsRes, updatesRes] = await Promise.all([
        supabase.from('projects').select('*').eq('client_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('support_tickets').select('*').eq('client_id', session.user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('update_requests').select('*').eq('client_id', session.user.id).order('created_at', { ascending: false }).limit(5),
      ])

      setProjects(projectsRes.data || [])
      setTickets(ticketsRes.data || [])
      setUpdates(updatesRes.data || [])
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

  return (
    <>
      <TopBar title="Vue d'ensemble" subtitle="Bienvenue sur votre espace QuickShip" />

      <div className="p-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Projets actifs" value={activeProjects.length} icon={FolderKanban} color="accent" />
          <StatCard label="Tickets ouverts" value={openTickets.length} icon={LifeBuoy} color="red" />
          <StatCard label="Modifications en cours" value={pendingUpdates.length} icon={RefreshCw} color="blue" />
        </div>

        {/* Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg">Mes projets</h2>
            <Link href="/projects" className="text-sm text-accent font-medium hover:text-accent-hover">
              Voir tous
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.slice(0, 4).map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="card hover:shadow-card-hover transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display font-semibold text-text-primary">{project.name}</h3>
                    {project.domain && (
                      <p className="text-sm text-text-secondary flex items-center gap-1 mt-0.5">
                        <Globe className="w-3.5 h-3.5" />
                        {project.domain}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={project.status} />
                </div>
                <div className="flex items-center gap-4 text-xs text-text-muted">
                  {project.deployed_url && (
                    <span className="flex items-center gap-1">
                      <ExternalLink className="w-3.5 h-3.5" /> Site en ligne
                    </span>
                  )}
                  {project.github_repo && (
                    <span className="flex items-center gap-1">
                      <Github className="w-3.5 h-3.5" /> GitHub
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {formatDate(project.updated_at)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Recent Tickets */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg">Tickets r&eacute;cents</h2>
              <Link href="/support" className="text-sm text-accent font-medium hover:text-accent-hover">
                Voir tous
              </Link>
            </div>
            <div className="card space-y-3">
              {tickets.length === 0 ? (
                <p className="text-sm text-text-muted py-4 text-center">Aucun ticket</p>
              ) : (
                tickets.map((ticket) => (
                  <Link key={ticket.id} href={`/support/${ticket.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-hover transition-colors">
                    {['resolved', 'closed'].includes(ticket.status) ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{ticket.subject}</p>
                      <p className="text-xs text-text-muted">{formatDate(ticket.created_at)}</p>
                    </div>
                    <StatusBadge status={ticket.status} />
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Recent Update Requests */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg">Demandes r&eacute;centes</h2>
              <Link href="/updates" className="text-sm text-accent font-medium hover:text-accent-hover">
                Voir toutes
              </Link>
            </div>
            <div className="card space-y-3">
              {updates.length === 0 ? (
                <p className="text-sm text-text-muted py-4 text-center">Aucune demande</p>
              ) : (
                updates.map((update) => (
                  <div key={update.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-hover transition-colors">
                    <RefreshCw className="w-5 h-5 text-teal-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{update.title}</p>
                      <p className="text-xs text-text-muted">{formatDate(update.created_at)}</p>
                    </div>
                    <StatusBadge status={update.status} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
