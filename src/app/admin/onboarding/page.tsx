'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { TopBar } from '@/components/layout/TopBar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, formatDateTime, getStatusLabel } from '@/lib/utils'
import { ClipboardList, Eye, ChevronDown, ChevronUp, Check, CheckCheck, Zap, Loader2, UserPlus, Copy } from 'lucide-react'
import { generateProjectPrompt } from '@/lib/generate-prompt'
import { useAdminMobileMenu } from '../layout'
import type { OnboardingResponse } from '@/types'

// Mapping des réponses d'onboarding par sections
const RESPONSE_SECTIONS: { title: string; keys: { key: string; label: string }[] }[] = [
  {
    title: 'Projet',
    keys: [
      { key: 'project_name', label: 'Nom du projet' },
      { key: 'activity', label: 'Activité' },
      { key: 'sector', label: 'Secteur' },
      { key: 'objective', label: 'Objectif' },
      { key: 'project_type', label: 'Type de projet' },
      { key: 'project_description', label: 'Description' },
      { key: 'deadline', label: 'Deadline' },
      { key: 'budget', label: 'Budget' },
    ],
  },
  {
    title: 'Cible & Stratégie',
    keys: [
      { key: 'target_audience', label: 'Audience cible' },
      { key: 'age_range', label: 'Tranche d\'âge' },
      { key: 'target_type', label: 'Type de cible' },
      { key: 'competitors', label: 'Concurrents' },
      { key: 'unique_value', label: 'Valeur unique' },
    ],
  },
  {
    title: 'Branding',
    keys: [
      { key: 'logo', label: 'Logo' },
      { key: 'brandbook', label: 'Charte graphique' },
      { key: 'colors', label: 'Couleurs' },
      { key: 'typography', label: 'Typographie' },
      { key: 'brand_assets', label: 'Assets de marque' },
    ],
  },
  {
    title: 'Style & Design',
    keys: [
      { key: 'style_universe', label: 'Univers stylistique' },
      { key: 'color_mood', label: 'Ambiance couleur' },
      { key: 'inspiration_sites', label: 'Sites d\'inspiration' },
      { key: 'design_preferences', label: 'Préférences design' },
    ],
  },
  {
    title: 'Contenu & Pages',
    keys: [
      { key: 'pages', label: 'Pages souhaitées' },
      { key: 'texts_ready', label: 'Textes prêts' },
      { key: 'features', label: 'Fonctionnalités' },
      { key: 'languages', label: 'Langues' },
      { key: 'content_type', label: 'Type de contenu' },
    ],
  },
  {
    title: 'Copywriting',
    keys: [
      { key: 'tone', label: 'Ton' },
      { key: 'slogan', label: 'Slogan' },
      { key: 'selling_points', label: 'Arguments de vente' },
      { key: 'seo_keywords', label: 'Mots-clés SEO' },
      { key: 'call_to_action', label: 'Call to action' },
    ],
  },
  {
    title: 'Domaine & Hébergement',
    keys: [
      { key: 'domain', label: 'Domaine' },
      { key: 'domain_name', label: 'Nom de domaine' },
      { key: 'hosting', label: 'Hébergement' },
      { key: 'emails', label: 'Emails' },
      { key: 'analytics', label: 'Analytics' },
    ],
  },
  {
    title: 'Accès',
    keys: [
      { key: 'access_registrar', label: 'Accès registrar' },
      { key: 'access_hosting', label: 'Accès hébergement' },
      { key: 'socials', label: 'Réseaux sociaux' },
      { key: 'social_links', label: 'Liens sociaux' },
    ],
  },
  {
    title: 'Documents',
    keys: [
      { key: 'drive_link', label: 'Lien Drive' },
      { key: 'anything_else', label: 'Autre chose' },
      { key: 'attachments', label: 'Pièces jointes' },
    ],
  },
  {
    title: 'Contact',
    keys: [
      { key: 'fullname', label: 'Nom complet' },
      { key: 'full_name', label: 'Nom complet' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Téléphone' },
      { key: 'referral', label: 'Recommandation' },
      { key: 'notes', label: 'Notes' },
    ],
  },
]

function getClientName(response: OnboardingResponse): string {
  const client = response.client as any
  const responses = response.responses as Record<string, any>
  return client?.full_name || responses?.fullname || responses?.full_name || 'Client inconnu'
}

function renderResponseValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

export default function OnboardingPage() {
  const [responses, setResponses] = useState<OnboardingResponse[]>([])
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [processResult, setProcessResult] = useState<Record<string, { success: boolean; password?: string; error?: string }>>({})
  const [loading, setLoading] = useState(true)
  const onMenuToggle = useAdminMobileMenu()
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

  async function handleProcess(response: OnboardingResponse) {
    setProcessingId(response.id)
    try {
      const res = await fetch('/api/admin/process-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding_response_id: response.id }),
      })
      const data = await res.json()

      if (!res.ok) {
        setProcessResult(prev => ({ ...prev, [response.id]: { success: false, error: data.error } }))
      } else {
        setProcessResult(prev => ({ ...prev, [response.id]: { success: true, password: data.temp_password } }))
        // Update local state
        setResponses(prev => prev.map(r => r.id === response.id ? { ...r, client_id: data.client_id, project_id: data.project_id } : r))
      }
    } catch {
      setProcessResult(prev => ({ ...prev, [response.id]: { success: false, error: 'Erreur réseau' } }))
    }
    setProcessingId(null)
  }

  function renderOrganizedResponses(responses: Record<string, unknown>) {
    const usedKeys = new Set<string>()

    const sections = RESPONSE_SECTIONS.map(section => {
      const fields = section.keys.filter(({ key }) => {
        if (usedKeys.has(key)) return false
        const val = responses[key]
        return val !== null && val !== undefined && val !== ''
      })

      fields.forEach(({ key }) => usedKeys.add(key))

      if (fields.length === 0) return null

      return (
        <div key={section.title}>
          <h4 className="text-xs font-bold text-accent uppercase tracking-wider mb-3">{section.title}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fields.map(({ key, label }) => (
              <div key={key}>
                <p className="text-xs font-semibold text-text-secondary mb-1">{label}</p>
                <p className="text-sm text-text-primary bg-surface-hover p-3 rounded-xl whitespace-pre-wrap">
                  {renderResponseValue(responses[key])}
                </p>
              </div>
            ))}
          </div>
        </div>
      )
    }).filter(Boolean)

    // Show any remaining keys not in sections
    const remainingKeys = Object.keys(responses).filter(k => !usedKeys.has(k) && responses[k] !== null && responses[k] !== undefined && responses[k] !== '')
    if (remainingKeys.length > 0) {
      sections.push(
        <div key="other">
          <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Autres</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {remainingKeys.map(key => (
              <div key={key}>
                <p className="text-xs font-semibold text-text-secondary mb-1">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
                <p className="text-sm text-text-primary bg-surface-hover p-3 rounded-xl whitespace-pre-wrap">
                  {renderResponseValue(responses[key])}
                </p>
              </div>
            ))}
          </div>
        </div>
      )
    }

    return <div className="space-y-6">{sections}</div>
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
        onMenuToggle={onMenuToggle}
      />

      <div className="p-4 md:p-8">
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
              const isProcessed = !!(response.client_id && response.project_id)
              const result = processResult[response.id]

              return (
                <div key={response.id} className="card">
                  {/* Header */}
                  <div
                    className="flex items-center gap-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : response.id)}
                  >
                    <Avatar name={getClientName(response)} src={client?.avatar_url} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-semibold text-text-primary">{getClientName(response)}</h3>
                        <span className="badge-purple">{getStatusLabel(response.questionnaire_type)}</span>
                        {response.reviewed_at && (
                          <span className="badge-success flex items-center gap-1">
                            <Check className="w-3 h-3" /> Revu
                          </span>
                        )}
                        {isProcessed && (
                          <span className="badge-success flex items-center gap-1">
                            <UserPlus className="w-3 h-3" /> Traité
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted">
                        {client?.company || client?.email || (response.responses as any)?.email} · {project?.name || (response.responses as any)?.project_name || 'Pas de projet lié'} · {formatDateTime(response.created_at)}
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
                      {!isProcessed && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleProcess(response) }}
                          disabled={processingId === response.id}
                          className="btn-primary text-xs gap-1"
                        >
                          {processingId === response.id ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Traitement...</>
                          ) : (
                            <><UserPlus className="w-3.5 h-3.5" /> Traiter</>
                          )}
                        </button>
                      )}
                      {!response.reviewed_at && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markReviewed(response.id) }}
                          className="btn-secondary text-xs gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Marquer revu
                        </button>
                      )}
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
                    </div>
                  </div>

                  {/* Process result banner */}
                  {result && (
                    <div className={`mt-4 p-3 rounded-xl text-sm ${result.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      {result.success ? (
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          <span>Client et projet créés avec succès. Mot de passe temporaire : <code className="font-mono bg-surface px-2 py-0.5 rounded">{result.password}</code></span>
                          <button
                            onClick={() => navigator.clipboard.writeText(result.password || '')}
                            className="ml-2 text-emerald-400 hover:text-emerald-300"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span>Erreur : {result.error}</span>
                      )}
                    </div>
                  )}

                  {/* Expanded Content — Organized by sections */}
                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-surface-border">
                      {renderOrganizedResponses(response.responses)}

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
