'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { TopBar } from '@/components/layout/TopBar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, formatDateTime, getStatusLabel } from '@/lib/utils'
import { ClipboardList, Eye, EyeOff, ChevronDown, ChevronUp, Check, Copy, CheckCheck, Zap } from 'lucide-react'
import { generateProjectPrompt } from '@/lib/generate-prompt'
import type { OnboardingResponse, Profile } from '@/types'

export default function OnboardingPage() {
  const [responses, setResponses] = useState<OnboardingResponse[]>([])
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('onboarding_responses')
        .select('*, client:profiles(full_name, email, company, avatar_url), project:projects(name)')
        .order('created_at', { ascending: false })

      setResponses(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = typeFilter === 'all'
    ? responses
    : responses.filter(r => r.questionnaire_type === typeFilter)

  async function markReviewed(id: string) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await supabase.from('onboarding_responses').update({
      reviewed_by: session.user.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', id)

    setResponses(prev => prev.map(r => r.id === id ? { ...r, reviewed_at: new Date().toISOString(), reviewed_by: session.user.id } : r))
  }

  function handleCopyPrompt(response: OnboardingResponse) {
    const prompt = generateProjectPrompt(response)
    navigator.clipboard.writeText(prompt)
    setCopiedId(response.id)
    setTimeout(() => setCopiedId(null), 3000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-[3px] border-surface-border border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <TopBar
        title="Questionnaires d'onboarding"
        subtitle={`${responses.length} réponse${responses.length !== 1 ? 's' : ''}`}
      />

      <div className="p-8">
        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          {['all', 'mvp', 'website', 'redesign'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                typeFilter === t
                  ? 'bg-accent text-black'
                  : 'bg-surface text-text-secondary border border-surface-border hover:bg-surface-hover'
              }`}
            >
              {t === 'all' ? 'Tous' : getStatusLabel(t)}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Aucune réponse"
            description="Aucun questionnaire d'onboarding n'a encore été soumis."
          />
        ) : (
          <div className="space-y-4">
            {filtered.map((response) => {
              const isExpanded = expandedId === response.id
              const client = response.client as any
              const project = response.project as any

              return (
                <div key={response.id} className="card">
                  {/* Header */}
                  <div
                    className="flex items-center gap-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : response.id)}
                  >
                    <Avatar name={client?.full_name || 'C'} src={client?.avatar_url} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-semibold text-text-primary">{client?.full_name || 'Client inconnu'}</h3>
                        <span className="badge-purple">{getStatusLabel(response.questionnaire_type)}</span>
                        {response.reviewed_at && (
                          <span className="badge-success flex items-center gap-1">
                            <Check className="w-3 h-3" /> Revu
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted">
                        {client?.company || client?.email} · {project?.name || 'Pas de projet lié'} · {formatDateTime(response.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopyPrompt(response) }}
                        className={`inline-flex items-center gap-1.5 text-xs font-mono px-3 py-2 rounded-lg transition-all duration-200 ${
                          copiedId === response.id
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20'
                        }`}
                        title="Copier le prompt IA pour créer ce projet"
                      >
                        {copiedId === response.id ? (
                          <><CheckCheck className="w-3.5 h-3.5" /> Copié !</>
                        ) : (
                          <><Zap className="w-3.5 h-3.5" /> Prompt IA</>
                        )}
                      </button>
                      {!response.reviewed_at && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markReviewed(response.id) }}
                          className="btn-primary text-xs gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Marquer revu
                        </button>
                      )}
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-surface-border">
                      <div className="space-y-4">
                        {Object.entries(response.responses).map(([key, value]) => (
                          <div key={key}>
                            <p className="text-xs font-semibold text-text-secondary mb-1">
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                            <p className="text-sm text-text-primary bg-surface-hover p-3 rounded-xl">
                              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                            </p>
                          </div>
                        ))}
                      </div>

                      {response.notes && (
                        <div className="mt-4 p-3 rounded-xl bg-accent/10">
                          <p className="text-xs font-semibold text-accent mb-1">Notes</p>
                          <p className="text-sm text-text-primary">{response.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
