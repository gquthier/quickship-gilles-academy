'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { TopBar } from '@/components/layout/TopBar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, getStatusLabel } from '@/lib/utils'
import {
  FolderKanban, Plus, Globe, Github, Clock, LayoutGrid, List,
  ChevronLeft, ChevronRight, Search, User, ExternalLink, ArrowRight,
  Loader2, MoreHorizontal, Columns,
} from 'lucide-react'
import Link from 'next/link'
import { useAdminMobileMenu } from '@/context/admin-mobile-menu'
import type { Project, ProjectStatus } from '@/types'
import { cn } from '@/lib/utils'

// ── Kanban columns definition ──────────────────────────────────────────────
const KANBAN_COLUMNS: {
  status: ProjectStatus
  label: string
  color: string
  border: string
  bg: string
  dot: string
}[] = [
  { status: 'draft',       label: 'Brouillon',    color: 'text-blue-400',    border: 'border-blue-500/30',   bg: 'bg-blue-500/5',    dot: 'bg-blue-400' },
  { status: 'in_progress', label: 'En cours',     color: 'text-amber-400',   border: 'border-amber-500/30',  bg: 'bg-amber-500/5',   dot: 'bg-amber-400' },
  { status: 'review',      label: 'En review',    color: 'text-purple-400',  border: 'border-purple-500/30', bg: 'bg-purple-500/5',  dot: 'bg-purple-400' },
  { status: 'deployed',    label: 'Deploye',      color: 'text-emerald-400', border: 'border-emerald-500/30',bg: 'bg-emerald-500/5', dot: 'bg-emerald-400' },
  { status: 'maintenance', label: 'Maintenance',  color: 'text-teal-400',    border: 'border-teal-500/30',   bg: 'bg-teal-500/5',    dot: 'bg-teal-400' },
]

const ALL_STATUSES: ProjectStatus[] = ['draft', 'in_progress', 'review', 'deployed', 'maintenance', 'paused', 'archived']
const KANBAN_STATUSES = KANBAN_COLUMNS.map(c => c.status)

// Status move order for the arrows
function getAdjacentStatus(current: ProjectStatus, direction: 'prev' | 'next'): ProjectStatus | null {
  const idx = KANBAN_STATUSES.indexOf(current)
  if (direction === 'prev') return idx > 0 ? KANBAN_STATUSES[idx - 1] : null
  return idx < KANBAN_STATUSES.length - 1 ? KANBAN_STATUSES[idx + 1] : null
}

type ProjectWithClient = Project & { client?: { full_name: string; company: string | null } }

// ── Kanban Card ──────────────────────────────────────────────────────────────
function KanbanCard({
  project,
  onStatusChange,
  moving,
}: {
  project: ProjectWithClient
  onStatusChange: (id: string, newStatus: ProjectStatus) => void
  moving: string | null
}) {
  const prevStatus = getAdjacentStatus(project.status, 'prev')
  const nextStatus = getAdjacentStatus(project.status, 'next')
  const isMoving = moving === project.id

  return (
    <div className="group bg-surface border-3 border-surface-border hover:border-accent hover:shadow-brutal-xs p-4 transition-all duration-150 cursor-default">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <Link
          href={`/admin/projects/${project.id}`}
          className="font-bold text-sm text-text-primary hover:text-accent leading-tight transition-colors line-clamp-2"
        >
          {project.name}
        </Link>
        {isMoving ? (
          <Loader2 className="w-4 h-4 text-accent animate-spin flex-shrink-0 mt-0.5" />
        ) : (
          <Link href={`/admin/projects/${project.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight className="w-4 h-4 text-text-muted hover:text-accent" />
          </Link>
        )}
      </div>

      {/* Client */}
      {project.client && (
        <div className="flex items-center gap-1.5 mb-3">
          <div className="w-5 h-5 bg-accent/20 flex items-center justify-center flex-shrink-0">
            <User className="w-3 h-3 text-accent" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-text-secondary font-bold truncate block">
              {project.client.full_name}
            </span>
            {project.client.company && (
              <span className="text-[10px] text-text-muted truncate block">{project.client.company}</span>
            )}
          </div>
        </div>
      )}

      {/* Domain */}
      {project.domain && (
        <div className="flex items-center gap-1 text-xs text-text-muted mb-3">
          <Globe className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{project.domain}</span>
        </div>
      )}

      {/* Tech stack */}
      {project.tech_stack.length > 0 && (
        <div className="flex gap-1 mb-3 flex-wrap">
          {project.tech_stack.slice(0, 3).map((t) => (
            <span key={t} className="text-[10px] font-mono bg-surface-hover text-text-muted px-1.5 py-0.5 border border-surface-border">
              {t}
            </span>
          ))}
          {project.tech_stack.length > 3 && (
            <span className="text-[10px] text-text-muted">+{project.tech_stack.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t-3 border-surface-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Move buttons */}
          {prevStatus && (
            <button
              onClick={() => onStatusChange(project.id, prevStatus)}
              disabled={isMoving}
              title={`<- ${getStatusLabel(prevStatus)}`}
              className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
          {nextStatus && (
            <button
              onClick={() => onStatusChange(project.id, nextStatus)}
              disabled={isMoving}
              title={`${getStatusLabel(nextStatus)} ->`}
              className="p-1 text-text-muted hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {project.deployed_url && (
            <a href={project.deployed_url} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-accent transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          {project.github_repo && (
            <a href={`https://github.com/${project.github_org || ''}/${project.github_repo}`} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-text-primary transition-colors">
              <Github className="w-3.5 h-3.5" />
            </a>
          )}
          <span className="text-[10px] text-text-muted font-mono">{formatDate(project.updated_at)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithClient[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [moving, setMoving] = useState<string | null>(null)
  const onMenuToggle = useAdminMobileMenu()
  const supabase = createClient()

  useEffect(() => {
    // Persist view preference
    const saved = localStorage.getItem('admin-projects-view')
    if (saved === 'list' || saved === 'kanban') setView(saved)
  }, [])

  function switchView(v: 'kanban' | 'list') {
    setView(v)
    localStorage.setItem('admin-projects-view', v)
  }

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('projects')
        .select('*, client:profiles(full_name, company)')
        .order('updated_at', { ascending: false })

      setProjects((data || []) as ProjectWithClient[])
      setLoading(false)
    }
    load()
  }, [])

  async function handleStatusChange(projectId: string, newStatus: ProjectStatus) {
    setMoving(projectId)
    const { error } = await supabase
      .from('projects')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', projectId)

    if (!error) {
      setProjects(prev => prev.map(p =>
        p.id === projectId ? { ...p, status: newStatus } : p
      ))
    }
    setMoving(null)
  }

  const filtered = useMemo(() => projects
    .filter(p => statusFilter === 'all' || p.status === statusFilter)
    .filter(p =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.domain || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.client?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.client?.company || '').toLowerCase().includes(search.toLowerCase())
    ), [projects, statusFilter, search])

  // Kanban: group by status (only kanban columns + others)
  const kanbanData = useMemo(() => {
    const searchFiltered = projects.filter(p =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.domain || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.client?.full_name || '').toLowerCase().includes(search.toLowerCase())
    )
    return KANBAN_COLUMNS.map(col => ({
      ...col,
      items: searchFiltered.filter(p => p.status === col.status),
    }))
  }, [projects, search])

  const totalKanban = kanbanData.reduce((s, c) => s + c.items.length, 0)
  const outsideKanban = projects.filter(p => !KANBAN_STATUSES.includes(p.status))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-3 border-surface-border border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <TopBar
        title="Projets"
        subtitle={`${projects.length} projet${projects.length !== 1 ? 's' : ''} au total`}
        onMenuToggle={onMenuToggle}
        actions={
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center bg-surface border-3 border-surface-border p-0.5 gap-0.5">
              <button
                onClick={() => switchView('kanban')}
                title="Vue Kanban"
                className={cn(
                  'p-1.5 transition-colors',
                  view === 'kanban' ? 'bg-accent text-black' : 'text-text-muted hover:text-text-primary'
                )}
              >
                <Columns className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => switchView('list')}
                title="Vue Liste"
                className={cn(
                  'p-1.5 transition-colors',
                  view === 'list' ? 'bg-accent text-black' : 'text-text-muted hover:text-text-primary'
                )}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
            <Link href="/admin/projects/new" className="btn-primary text-xs gap-1.5">
              <Plus className="w-4 h-4" /> Nouveau projet
            </Link>
          </div>
        }
      />

      {/* Search bar (always visible) */}
      <div className="px-4 md:px-8 pt-4 pb-0 flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            type="text"
            className="input pl-9 w-64"
            placeholder="Rechercher projet, client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status filter (list view only) */}
        {view === 'list' && (
          <div className="flex gap-1.5 flex-wrap">
            {(['all', ...ALL_STATUSES] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors border-3',
                  statusFilter === s
                    ? 'bg-accent text-black border-accent'
                    : 'bg-surface text-text-secondary border-surface-border hover:border-accent hover:text-text-primary'
                )}
              >
                {s === 'all' ? 'Tous' : getStatusLabel(s)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── KANBAN VIEW ──────────────────────────────────────────────────── */}
      {view === 'kanban' && (
        <div className="p-4 md:p-8 pt-4">
          {/* Column summary */}
          <div className="flex items-center gap-2 mb-4 text-xs text-text-muted font-mono">
            <Columns className="w-3.5 h-3.5" />
            <span>{totalKanban} projet{totalKanban !== 1 ? 's' : ''} sur le board</span>
            {outsideKanban.length > 0 && (
              <span className="text-text-muted/60">
                · {outsideKanban.length} en pause/archive (non affiches)
              </span>
            )}
          </div>

          {/* Kanban grid -- horizontal scroll on mobile */}
          <div className="overflow-x-auto pb-4">
            <div
              className="grid gap-4 min-w-[900px]"
              style={{ gridTemplateColumns: `repeat(${KANBAN_COLUMNS.length}, minmax(200px, 1fr))` }}
            >
              {kanbanData.map((col) => (
                <div key={col.status} className="flex flex-col gap-2">
                  {/* Column header */}
                  <div className={cn(
                    'flex items-center justify-between px-3 py-2 border-3',
                    col.border, col.bg
                  )}>
                    <div className="flex items-center gap-2">
                      <span className={cn('w-2 h-2 rounded-full', col.dot)} />
                      <span className={cn('text-xs font-black uppercase tracking-wider', col.color)}>
                        {col.label}
                      </span>
                    </div>
                    <span className={cn(
                      'text-xs font-black px-1.5 py-0.5 min-w-[20px] text-center font-mono',
                      col.items.length > 0 ? `${col.bg} ${col.color}` : 'text-text-muted'
                    )}>
                      {col.items.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex flex-col gap-2 min-h-[200px]">
                    {col.items.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center border-3 border-dashed border-surface-border/50 py-10">
                        <span className="text-xs text-text-muted/50 uppercase tracking-wider">Aucun projet</span>
                      </div>
                    ) : (
                      col.items.map((project) => (
                        <KanbanCard
                          key={project.id}
                          project={project}
                          onStatusChange={handleStatusChange}
                          moving={moving}
                        />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Paused/Archived section */}
          {outsideKanban.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-black text-text-muted mb-3 uppercase tracking-widest">Pause / Archive</h3>
              <div className="flex flex-wrap gap-3">
                {outsideKanban.map((p) => (
                  <Link
                    key={p.id}
                    href={`/admin/projects/${p.id}`}
                    className="flex items-center gap-2 bg-surface border-3 border-surface-border px-3 py-2 text-sm hover:border-accent transition-colors"
                  >
                    <StatusBadge status={p.status} />
                    <span className="text-text-secondary font-bold">{p.name}</span>
                    <span className="text-text-muted text-xs font-mono">{p.client?.full_name || ''}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── LIST VIEW ────────────────────────────────────────────────────── */}
      {view === 'list' && (
        <div className="p-4 md:p-8 pt-4">
          {filtered.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="Aucun projet"
              description={search || statusFilter !== 'all' ? 'Aucun resultat pour cette recherche.' : "Aucun projet pour l'instant."}
            />
          ) : (
            <div className="card overflow-hidden p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b-3 border-surface-border">
                    <th className="text-left text-xs font-black uppercase tracking-wider text-text-muted p-4">Projet</th>
                    <th className="text-left text-xs font-black uppercase tracking-wider text-text-muted p-4 hidden md:table-cell">Client</th>
                    <th className="text-left text-xs font-black uppercase tracking-wider text-text-muted p-4 hidden lg:table-cell">Domaine</th>
                    <th className="text-left text-xs font-black uppercase tracking-wider text-text-muted p-4">Statut</th>
                    <th className="text-left text-xs font-black uppercase tracking-wider text-text-muted p-4 hidden lg:table-cell">Liens</th>
                    <th className="text-left text-xs font-black uppercase tracking-wider text-text-muted p-4 hidden md:table-cell">Mis a jour</th>
                    <th className="text-left text-xs font-black uppercase tracking-wider text-text-muted p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {filtered.map((project) => (
                    <tr key={project.id} className="hover:bg-surface-hover transition-colors group">
                      <td className="p-4">
                        <Link href={`/admin/projects/${project.id}`} className="text-sm font-bold text-text-primary hover:text-accent">
                          {project.name}
                        </Link>
                        {project.tech_stack.length > 0 && (
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {project.tech_stack.slice(0, 2).map((t) => (
                              <span key={t} className="text-[10px] font-mono bg-surface-hover text-text-muted px-1.5 py-0.5 border border-surface-border">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <p className="text-sm text-text-secondary">{project.client?.full_name || '--'}</p>
                        <p className="text-xs text-text-muted">{project.client?.company || ''}</p>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        {project.domain ? (
                          <span className="text-sm text-text-secondary flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5" /> {project.domain}
                          </span>
                        ) : <span className="text-sm text-text-muted">--</span>}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <StatusBadge status={project.status} />
                          {/* Quick move in list view */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                            {getAdjacentStatus(project.status, 'prev') && (
                              <button
                                onClick={() => handleStatusChange(project.id, getAdjacentStatus(project.status, 'prev')!)}
                                className="p-0.5 text-text-muted hover:text-text-primary hover:bg-surface-hover"
                                title={`<- ${getStatusLabel(getAdjacentStatus(project.status, 'prev')!)}`}
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {getAdjacentStatus(project.status, 'next') && (
                              <button
                                onClick={() => handleStatusChange(project.id, getAdjacentStatus(project.status, 'next')!)}
                                className="p-0.5 text-text-muted hover:text-accent hover:bg-accent/10"
                                title={`${getStatusLabel(getAdjacentStatus(project.status, 'next')!)} ->`}
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          {project.deployed_url && (
                            <a href={project.deployed_url} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-accent">
                              <Globe className="w-4 h-4" />
                            </a>
                          )}
                          {project.github_repo && (
                            <a href={`https://github.com/${project.github_org || ''}/${project.github_repo}`} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-text-primary">
                              <Github className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="text-xs text-text-muted flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" /> {formatDate(project.updated_at)}
                        </span>
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/admin/projects/${project.id}`}
                          className="text-xs text-accent hover:text-accent-hover font-bold uppercase tracking-wide"
                        >
                          Voir →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  )
}
