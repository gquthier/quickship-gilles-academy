'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { TopBar } from '@/components/layout/TopBar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { formatDate, formatDateTime, getStatusLabel } from '@/lib/utils'
import {
  ArrowLeft,
  RefreshCw,
  Clock,
  Tag,
  FolderKanban,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  Hourglass,
  MessageSquare,
  Info,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { UpdateRequest, Profile } from '@/types'
import { useMobileMenu } from '@/context/mobile-menu'

const STATUS_TIMELINE: { key: string; label: string }[] = [
  { key: 'pending',     label: 'Soumise' },
  { key: 'accepted',    label: 'Acceptée' },
  { key: 'in_progress', label: 'En cours' },
  { key: 'completed',   label: 'Terminée' },
]

const STATUS_COLORS: Record<string, string> = {
  pending:     'text-amber-400 bg-amber-400/10 border-amber-400/30',
  accepted:    'text-blue-400 bg-blue-400/10 border-blue-400/30',
  in_progress: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  completed:   'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  rejected:    'text-red-400 bg-red-400/10 border-red-400/30',
}

const PRIORITY_COLORS: Record<string, string> = {
  low:    'text-text-muted',
  medium: 'text-amber-400',
  high:   'text-orange-400',
  urgent: 'text-red-400',
}

const PRIORITY_LABELS: Record<string, string> = {
  low:    'Faible',
  medium: 'Moyenne',
  high:   'Haute',
  urgent: 'Urgente',
}

type UpdateWithProject = UpdateRequest & {
  project: { id: string; name: string } | null
}

export default function UpdateDetailPage({ params }: { params: { id: string } }) {
  const onMenuToggle = useMobileMenu()
  const [update, setUpdate] = useState<UpdateWithProject | null>(null)
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const [profileRes, updateRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase
          .from('update_requests')
          .select('*, project:projects(id, name)')
          .eq('id', params.id)
          .single(),
      ])

      if (profileRes.data) setCurrentUser(profileRes.data as Profile)
      if (updateRes.data) setUpdate(updateRes.data as UpdateWithProject)
      setLoading(false)
    }
    load()
  }, [params.id])

  async function handleCancel() {
    if (!update) return
    setCancelling(true)
    const { data } = await supabase
      .from('update_requests')
      .update({ status: 'rejected' })
      .eq('id', update.id)
      .select()
      .single()
    if (data) setUpdate({ ...update, status: 'rejected' })
    setCancelling(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-[3px] border-surface-border border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  if (!update) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary">Demande introuvable</p>
          <Link href="/updates" className="text-accent text-sm mt-2 inline-block hover:underline">
            ← Retour aux demandes
          </Link>
        </div>
      </div>
    )
  }

  const statusIndex = STATUS_TIMELINE.findIndex(s => s.key === update.status)
  const isTerminal = update.status === 'completed' || update.status === 'rejected'
  const canCancel = update.status === 'pending'

  return (
    <>
      <TopBar
        title="Détail de la demande"
        subtitle={update.title}
        onMenuToggle={onMenuToggle}
      />

      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        {/* Back */}
        <Link
          href="/updates"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 group transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Toutes les demandes
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── LEFT COLUMN — main content ────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Header card */}
            <div className="card">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <h1 className="font-display font-extrabold text-xl text-text-primary leading-tight">
                    {update.title}
                  </h1>
                  {update.project && (
                    <Link
                      href={`/projects/${update.project.id}`}
                      className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-accent mt-1.5 transition-colors"
                    >
                      <FolderKanban className="w-3.5 h-3.5" />
                      {update.project.name}
                    </Link>
                  )}
                </div>
                <span className={cn(
                  'shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border',
                  STATUS_COLORS[update.status] || 'text-text-muted bg-surface border-surface-border'
                )}>
                  {update.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {update.status === 'rejected' && <XCircle className="w-3.5 h-3.5" />}
                  {update.status === 'in_progress' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {getStatusLabel(update.status)}
                </span>
              </div>

              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                {update.description}
              </p>
            </div>

            {/* Progress timeline */}
            {update.status !== 'rejected' && (
              <div className="card">
                <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-5">
                  Progression
                </h2>
                <div className="relative flex items-start">
                  {/* Connecting line */}
                  <div className="absolute top-[11px] left-[11px] right-[11px] h-[2px] bg-surface-border" />
                  <div
                    className="absolute top-[11px] left-[11px] h-[2px] bg-accent transition-all duration-500"
                    style={{ width: `${Math.max(0, (statusIndex / (STATUS_TIMELINE.length - 1)) * 100)}%` }}
                  />
                  {STATUS_TIMELINE.map((step, idx) => {
                    const done = idx <= statusIndex
                    const current = idx === statusIndex
                    return (
                      <div key={step.key} className="relative flex-1 flex flex-col items-center">
                        <div className={cn(
                          'w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center z-10 transition-all duration-300',
                          done
                            ? 'bg-accent border-accent'
                            : 'bg-surface border-surface-border',
                          current && 'ring-2 ring-accent/30 ring-offset-1 ring-offset-bg'
                        )}>
                          {done && !current && (
                            <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={cn(
                          'text-[11px] mt-2 text-center leading-tight',
                          current ? 'text-accent font-semibold' : done ? 'text-text-secondary' : 'text-text-muted'
                        )}>
                          {step.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Admin notes */}
            {update.admin_notes && (
              <div className="card border-accent/20 bg-accent/5">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-accent" />
                  <h2 className="text-sm font-semibold text-accent">Note de l&apos;équipe</h2>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {update.admin_notes}
                </p>
              </div>
            )}

            {/* Rejected notice */}
            {update.status === 'rejected' && (
              <div className="card border-red-500/20 bg-red-500/5">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-400 mb-1">Demande refusée</p>
                    <p className="text-sm text-text-muted">
                      Cette demande n&apos;a pas pu être traitée.
                      {!update.admin_notes && " Contactez le support pour en savoir plus."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Completed notice */}
            {update.status === 'completed' && (
              <div className="card border-emerald-500/20 bg-emerald-500/5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-400 mb-1">Modification terminée</p>
                    <p className="text-sm text-text-muted">
                      Votre demande a été réalisée.
                      {update.completed_at && ` Complétée le ${formatDate(update.completed_at)}.`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Cancel action */}
            {canCancel && (
              <div className="card border-surface-border">
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-text-secondary">
                      Vous pouvez annuler cette demande si elle n&apos;est plus nécessaire.
                    </p>
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-all duration-200 disabled:opacity-50"
                    >
                      {cancelling ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Annuler la demande
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN — info sidebar ───────────────────────────── */}
          <div className="space-y-4">

            {/* Status */}
            <div className="card">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                Informations
              </h3>
              <div className="space-y-3">
                {/* Priority */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-text-muted">
                    <Tag className="w-3.5 h-3.5" />
                    Priorité
                  </span>
                  <span className={cn(
                    'text-xs font-semibold',
                    PRIORITY_COLORS[update.priority] || 'text-text-muted'
                  )}>
                    {PRIORITY_LABELS[update.priority] || update.priority}
                  </span>
                </div>

                {/* Estimated hours */}
                {update.estimated_hours != null && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs text-text-muted">
                      <Hourglass className="w-3.5 h-3.5" />
                      Estimation
                    </span>
                    <span className="text-xs font-semibold text-text-primary">
                      {update.estimated_hours}h
                    </span>
                  </div>
                )}

                {/* Project */}
                {update.project && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs text-text-muted">
                      <FolderKanban className="w-3.5 h-3.5" />
                      Projet
                    </span>
                    <Link
                      href={`/projects/${update.project.id}`}
                      className="text-xs font-medium text-accent hover:underline truncate max-w-[120px]"
                    >
                      {update.project.name}
                    </Link>
                  </div>
                )}

                {/* Created */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-text-muted">
                    <Calendar className="w-3.5 h-3.5" />
                    Soumise le
                  </span>
                  <span className="text-xs text-text-secondary">
                    {formatDate(update.created_at)}
                  </span>
                </div>

                {/* Completed */}
                {update.completed_at && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs text-text-muted">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Terminée le
                    </span>
                    <span className="text-xs text-emerald-400 font-medium">
                      {formatDate(update.completed_at)}
                    </span>
                  </div>
                )}

                {/* Updated */}
                <div className="flex items-center justify-between pt-1 border-t border-surface-border">
                  <span className="flex items-center gap-2 text-xs text-text-muted">
                    <Clock className="w-3.5 h-3.5" />
                    Mise à jour
                  </span>
                  <span className="text-xs text-text-muted">
                    {formatDate(update.updated_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="card">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                Actions rapides
              </h3>
              <div className="space-y-2">
                <Link
                  href="/updates/new"
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all duration-200"
                >
                  <RefreshCw className="w-4 h-4" />
                  Nouvelle demande
                </Link>
                <Link
                  href="/support/new"
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all duration-200"
                >
                  <MessageSquare className="w-4 h-4" />
                  Ouvrir un ticket support
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
