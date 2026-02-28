'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { TopBar } from '@/components/layout/TopBar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate, formatDateTime, formatDistanceToNow } from '@/lib/utils'
import {
  Globe,
  ExternalLink,
  Github,
  Clock,
  Server,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  RefreshCw,
  MessageSquare,
  ArrowRight,
  Check,
} from 'lucide-react'
import Link from 'next/link'
import type { Project, SupportTicket, TicketMessage, VercelDeployment } from '@/types'
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

const TIMELINE_STEPS = [
  { key: 'draft', label: 'Demarrage' },
  { key: 'in_progress', label: 'Developpement' },
  { key: 'review', label: 'Review' },
  { key: 'deployed', label: 'Livraison' },
  { key: 'maintenance', label: 'Maintenance' },
]

const statusToStep: Record<string, number> = {
  draft: 0,
  in_progress: 1,
  review: 2,
  deployed: 3,
  maintenance: 4,
  paused: 1,
  archived: 4,
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const onMenuToggle = useMobileMenu()
  const [project, setProject] = useState<Project | null>(null)
  const [deployments, setDeployments] = useState<VercelDeployment[]>([])
  const [recentTicket, setRecentTicket] = useState<SupportTicket | null>(null)
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [deploymentsLoading, setDeploymentsLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [projectRes] = await Promise.all([
        supabase.from('projects').select('*').eq('id', params.id).single(),
      ])

      if (projectRes.data) {
        setProject(projectRes.data as Project)
        if (projectRes.data.vercel_project_id) {
          fetchDeployments(projectRes.data.vercel_project_id, projectRes.data.vercel_team_id)
        }
        // Fetch most recent ticket for this project
        const ticketRes = await supabase
          .from('support_tickets')
          .select('*')
          .eq('project_id', params.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (ticketRes.data) {
          setRecentTicket(ticketRes.data as SupportTicket)
          const msgRes = await supabase
            .from('ticket_messages')
            .select('*, sender:profiles(full_name, avatar_url)')
            .eq('ticket_id', ticketRes.data.id)
            .eq('is_internal', false)
            .order('created_at', { ascending: false })
            .limit(3)
          setTicketMessages((msgRes.data || []).reverse() as TicketMessage[])
        }
      }
      setLoading(false)
    }
    load()
  }, [params.id])

  async function fetchDeployments(projectId: string, teamId?: string | null) {
    setDeploymentsLoading(true)
    try {
      const res = await fetch(`/api/vercel?projectId=${projectId}${teamId ? `&teamId=${teamId}` : ''}`)
      const data = await res.json()
      setDeployments(data.deployments || [])
    } catch {
      // Vercel API not configured
    }
    setDeploymentsLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-[3px] border-surface-border border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-text-secondary">Projet introuvable</p>
      </div>
    )
  }

  function getDeploymentIcon(state: string) {
    switch (state) {
      case 'READY': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />
      case 'ERROR': return <XCircle className="w-5 h-5 text-red-400" />
      case 'BUILDING': return <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
      default: return <Clock className="w-5 h-5 text-text-muted" />
    }
  }

  const currentStep = statusToStep[project.status] ?? 0
  const progress = statusProgress[project.status] ?? 0

  return (
    <>
      <TopBar
        title={project.name}
        subtitle={project.domain || undefined}
        onMenuToggle={onMenuToggle}
        actions={
          <div className="flex items-center gap-2">
            {project.deployed_url && (
              <a href={project.deployed_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs gap-1.5">
                <ExternalLink className="w-4 h-4" /> Voir le site
              </a>
            )}
            {project.github_repo && (
              <a href={`https://github.com/${project.github_org || ''}/${project.github_repo}`} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs gap-1.5">
                <Github className="w-4 h-4" /> GitHub
              </a>
            )}
          </div>
        }
      />

      <div className="p-4 md:p-8">
        <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-accent mb-6 font-bold uppercase tracking-wide">
          <ArrowLeft className="w-4 h-4" /> Retour aux projets
        </Link>

        {/* Progress Timeline */}
        <div className="card mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title text-base">Avancement du projet</h2>
            <div className="flex items-center gap-2">
              <StatusBadge status={project.status} />
              <span className="text-xs font-mono text-accent font-bold">{progress}%</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-surface-border overflow-hidden mb-5">
            <div
              className="h-full bg-accent transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Steps */}
          <div className="flex items-start justify-between">
            {TIMELINE_STEPS.map((step, idx) => {
              const isDone = idx < currentStep
              const isCurrent = idx === currentStep
              const isFuture = idx > currentStep
              return (
                <div key={step.key} className="flex flex-col items-center flex-1 relative">
                  {/* Connector line */}
                  {idx < TIMELINE_STEPS.length - 1 && (
                    <div className={`absolute top-3.5 left-1/2 w-full h-px ${isDone || isCurrent ? 'bg-accent/30' : 'bg-surface-border'}`} />
                  )}
                  {/* Circle */}
                  <div className={`relative z-10 w-7 h-7 border-3 flex items-center justify-center mb-2 transition-all ${
                    isDone
                      ? 'bg-emerald-500/20 border-emerald-500/60'
                      : isCurrent
                      ? 'bg-accent/20 border-accent'
                      : 'bg-surface-border/50 border-surface-border'
                  }`}>
                    {isDone ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : isCurrent ? (
                      <div className="w-2 h-2 bg-accent" />
                    ) : (
                      <div className="w-2 h-2 bg-surface-border" />
                    )}
                  </div>
                  {/* Label */}
                  <span className={`text-[10px] text-center leading-tight font-mono hidden sm:block uppercase tracking-wider ${
                    isCurrent ? 'text-accent font-bold' : isDone ? 'text-emerald-400' : isFuture ? 'text-text-muted' : 'text-text-muted'
                  }`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-3 md:space-y-6">
            {/* Project Info Card */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="section-title text-lg">Informations du projet</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-6">
                <div>
                  <p className="label">Domaine</p>
                  <p className="text-sm font-medium">{project.domain || '\u2014'}</p>
                </div>
                <div>
                  <p className="label">Stack technique</p>
                  <div className="flex flex-wrap gap-1">
                    {project.tech_stack.length > 0 ? project.tech_stack.map((t) => (
                      <span key={t} className="pill text-xs px-2 py-0.5">{t}</span>
                    )) : <span className="text-sm text-text-muted">\u2014</span>}
                  </div>
                </div>
                <div>
                  <p className="label">Cr&eacute;&eacute; le</p>
                  <p className="text-sm font-medium">{formatDate(project.created_at)}</p>
                </div>
                <div>
                  <p className="label">Derni&egrave;re mise &agrave; jour</p>
                  <p className="text-sm font-medium">{formatDate(project.updated_at)}</p>
                </div>
              </div>
              {project.description && (
                <div className="mt-6 pt-6 border-t-3 border-surface-border">
                  <p className="label">Description</p>
                  <p className="text-sm text-text-primary">{project.description}</p>
                </div>
              )}
            </div>

            {/* Messages section */}
            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <h2 className="section-title text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-text-muted" />
                  Messages r&eacute;cents
                </h2>
                {recentTicket && (
                  <Link
                    href={`/support/${recentTicket.id}`}
                    className="text-xs text-accent hover:text-accent-hover flex items-center gap-1 font-bold uppercase tracking-wide"
                  >
                    Voir tous <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              {!recentTicket ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 border-3 border-accent/30 bg-accent/10 flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-5 h-5 text-accent" />
                  </div>
                  <p className="text-sm text-text-muted mb-4">Aucun message pour l&apos;instant</p>
                  <Link href={`/support/new?project=${project.id}`} className="btn-primary text-xs inline-flex">
                    Envoyer un message
                  </Link>
                </div>
              ) : ticketMessages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-text-muted mb-4">Aucun message dans ce ticket</p>
                  <Link href={`/support/${recentTicket.id}`} className="btn-secondary text-xs inline-flex">
                    Ouvrir le ticket
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {ticketMessages.map((msg) => {
                    const sender = (msg as TicketMessage & { sender?: { full_name: string } }).sender
                    const isTeam = sender?.full_name !== undefined
                    return (
                      <div key={msg.id} className={`flex gap-3 ${isTeam ? '' : 'flex-row-reverse'}`}>
                        <div className="w-7 h-7 border-3 border-surface-border bg-surface-hover flex items-center justify-center flex-shrink-0 text-xs font-bold text-text-secondary font-mono">
                          {sender?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>
                        <div className={`flex-1 ${isTeam ? '' : 'flex flex-col items-end'}`}>
                          <div className={`border-3 px-3 py-2.5 text-sm max-w-[85%] ${
                            isTeam
                              ? 'border-surface-border bg-surface-hover text-text-primary'
                              : 'border-accent/30 bg-accent/10 text-text-primary'
                          }`}>
                            {msg.message}
                          </div>
                          <p className="text-[10px] text-text-muted mt-1 font-mono">
                            {formatDistanceToNow(new Date(msg.created_at))}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Vercel Deployments */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="section-title text-lg flex items-center gap-2">
                  <Server className="w-5 h-5 text-text-muted" />
                  D&eacute;ploiements Vercel
                </h2>
                {project.vercel_project_id && (
                  <button
                    onClick={() => fetchDeployments(project.vercel_project_id!, project.vercel_team_id)}
                    className="text-xs text-accent hover:text-accent-hover flex items-center gap-1 font-bold uppercase tracking-wide"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Actualiser
                  </button>
                )}
              </div>

              {!project.vercel_project_id ? (
                <p className="text-sm text-text-muted text-center py-8">Aucun projet Vercel li&eacute;</p>
              ) : deploymentsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-accent animate-spin" />
                </div>
              ) : deployments.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-8">Aucun d&eacute;ploiement r&eacute;cent</p>
              ) : (
                <div className="space-y-3">
                  {deployments.slice(0, 10).map((d) => (
                    <a
                      key={d.uid}
                      href={`https://${d.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 border-3 border-surface-border hover:border-accent hover:bg-surface-hover transition-all"
                    >
                      {getDeploymentIcon(d.state)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {d.meta?.githubCommitMessage || d.url}
                        </p>
                        <p className="text-xs text-text-muted">
                          {d.meta?.githubCommitRef && `${d.meta.githubCommitRef} \u00b7 `}
                          {formatDateTime(new Date(d.created))}
                        </p>
                      </div>
                      <span className={`text-xs font-medium font-mono uppercase ${d.state === 'READY' ? 'text-emerald-400' : d.state === 'ERROR' ? 'text-red-400' : 'text-amber-400'}`}>
                        {d.state}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-3 md:space-y-6">
            {/* Quick Links */}
            <div className="card">
              <h3 className="label mb-4">Liens rapides</h3>
              <div className="space-y-2">
                {project.deployed_url && (
                  <a href={project.deployed_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 border-3 border-surface-border hover:border-accent hover:bg-surface-hover transition-all text-sm">
                    <Globe className="w-5 h-5 text-emerald-400" />
                    <span>Site en production</span>
                    <ExternalLink className="w-4 h-4 text-text-muted ml-auto" />
                  </a>
                )}
                {project.staging_url && (
                  <a href={project.staging_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 border-3 border-surface-border hover:border-accent hover:bg-surface-hover transition-all text-sm">
                    <Globe className="w-5 h-5 text-amber-400" />
                    <span>Site de staging</span>
                    <ExternalLink className="w-4 h-4 text-text-muted ml-auto" />
                  </a>
                )}
                {project.github_repo && (
                  <a href={`https://github.com/${project.github_org || ''}/${project.github_repo}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 border-3 border-surface-border hover:border-accent hover:bg-surface-hover transition-all text-sm">
                    <Github className="w-5 h-5 text-text-primary" />
                    <span>Repository GitHub</span>
                    <ExternalLink className="w-4 h-4 text-text-muted ml-auto" />
                  </a>
                )}
                {!project.deployed_url && !project.staging_url && !project.github_repo && (
                  <p className="text-sm text-text-muted text-center py-4">Aucun lien configur&eacute;</p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="label mb-4">Actions rapides</h3>
              <div className="space-y-2">
                <Link href={`/updates/new?project=${project.id}`} className="btn-primary w-full justify-center text-xs">
                  <RefreshCw className="w-4 h-4 mr-2" /> Demander une modification
                </Link>
                <Link href={`/support/new?project=${project.id}`} className="btn-secondary w-full justify-center text-xs">
                  Contacter le support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
