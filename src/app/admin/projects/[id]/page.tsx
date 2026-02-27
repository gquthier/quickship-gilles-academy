'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { TopBar } from '@/components/layout/TopBar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { formatDate, formatDateTime, getStatusLabel, getStatusColor } from '@/lib/utils'
import {
  ArrowLeft,
  Globe,
  ExternalLink,
  Github,
  Server,
  RefreshCw,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  LifeBuoy,
  Edit3,
  Copy,
  CheckCheck,
  FileText,
  Zap,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { useAdminMobileMenu } from '@/context/admin-mobile-menu'
import { generateProjectPrompt } from '@/lib/generate-prompt'
import type { Project, SupportTicket, UpdateRequest, VercelDeployment, OnboardingResponse } from '@/types'

// Same sections mapping as onboarding page
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

const DELIVERY_STATUSES = [
  { value: 'not_started', label: 'Pas commencé' },
  { value: 'v1_ready', label: 'V1 disponible' },
  { value: 'v2', label: 'V2' },
  { value: 'completed', label: 'Terminé' },
]

function renderResponseValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

export default function AdminProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [updates, setUpdates] = useState<UpdateRequest[]>([])
  const [deployments, setDeployments] = useState<VercelDeployment[]>([])
  const [onboarding, setOnboarding] = useState<OnboardingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editData, setEditData] = useState<Partial<Project>>({})
  const [promptCopied, setPromptCopied] = useState(false)
  const [promptTab, setPromptTab] = useState<'base' | 'gemini'>('base')
  const [generatingAiPrompt, setGeneratingAiPrompt] = useState(false)
  const [aiPromptCopied, setAiPromptCopied] = useState(false)
  const [savingDelivery, setSavingDelivery] = useState(false)
  const onMenuToggle = useAdminMobileMenu()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [
        { data: projectData },
        { data: ticketsData },
        { data: updatesData },
        { data: onboardingData },
      ] = await Promise.all([
        supabase.from('projects').select('*, client:profiles(full_name, company, email)').eq('id', params.id).single(),
        supabase.from('support_tickets').select('*').eq('project_id', params.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('update_requests').select('*').eq('project_id', params.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('onboarding_responses').select('*, client:profiles!client_id(full_name, email, company)').eq('project_id', params.id).order('created_at', { ascending: false }).limit(1),
      ])

      if (projectData) {
        setProject(projectData as any)
        setEditData(projectData as any)
        if (projectData.vercel_project_id) {
          fetchDeployments(projectData.vercel_project_id, projectData.vercel_team_id)
        }
      }
      setTickets(ticketsData || [])
      setUpdates(updatesData || [])
      setOnboarding(onboardingData?.[0] || null)
      setLoading(false)
    }
    load()
  }, [params.id])

  async function fetchDeployments(projectId: string, teamId?: string | null) {
    try {
      const res = await fetch(`/api/vercel?projectId=${projectId}${teamId ? `&teamId=${teamId}` : ''}`)
      const data = await res.json()
      setDeployments(data.deployments || [])
    } catch {}
  }

  async function handleSave() {
    setSaving(true)
    const { status, domain, vercel_project_id, vercel_team_id, github_repo, github_org, deployed_url, staging_url, notes } = editData as Project
    await supabase.from('projects').update({
      status, domain, vercel_project_id, vercel_team_id, github_repo, github_org, deployed_url, staging_url, notes,
    }).eq('id', params.id)

    setProject({ ...project!, ...editData } as Project)
    setEditing(false)
    setSaving(false)
  }

  async function handleDeliveryStatusChange(newStatus: string) {
    setSavingDelivery(true)
    await supabase.from('projects').update({ delivery_status: newStatus }).eq('id', params.id)
    setProject(prev => prev ? { ...prev, delivery_status: newStatus } : prev)
    setSavingDelivery(false)
  }

  async function handleUpdateRequestStatus(requestId: string, newStatus: string) {
    await supabase.from('update_requests').update({ status: newStatus }).eq('id', requestId)
    setUpdates(prev => prev.map(u => u.id === requestId ? { ...u, status: newStatus as any } : u))
  }

  function handleCopyPrompt() {
    if (!onboarding) return
    if (promptTab === 'gemini' && project?.ai_prompt) {
      navigator.clipboard.writeText(project.ai_prompt)
      setAiPromptCopied(true)
      setTimeout(() => setAiPromptCopied(false), 3000)
    } else {
      const prompt = generateProjectPrompt(onboarding)
      navigator.clipboard.writeText(prompt)
      setPromptCopied(true)
      setTimeout(() => setPromptCopied(false), 3000)
    }
  }

  async function handleGenerateAiPrompt() {
    if (!onboarding || !project) return
    setGeneratingAiPrompt(true)
    try {
      const res = await fetch('/api/admin/generate-ai-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          onboarding_response_id: onboarding.id,
        }),
      })
      const data = await res.json()
      if (res.ok && data.ai_prompt) {
        setProject(prev => prev ? { ...prev, ai_prompt: data.ai_prompt } : prev)
      } else {
        alert(data.error || 'Erreur lors de la génération')
      }
    } catch {
      alert('Erreur réseau')
    } finally {
      setGeneratingAiPrompt(false)
    }
  }

  function renderOrganizedBrief(responses: Record<string, unknown>) {
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

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-[3px] border-surface-border border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  const client = project.client as any

  return (
    <>
      <TopBar
        title={project.name}
        subtitle={project.domain || client?.full_name}
        onMenuToggle={onMenuToggle}
        actions={
          <div className="flex gap-2">
            {!editing ? (
              <button onClick={() => setEditing(true)} className="btn-secondary text-xs gap-1.5">
                <Edit3 className="w-4 h-4" /> Modifier
              </button>
            ) : (
              <>
                <button onClick={() => setEditing(false)} className="btn-secondary text-xs">Annuler</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary text-xs gap-1.5">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Sauvegarder
                </button>
              </>
            )}
          </div>
        }
      />

      <div className="p-4 md:p-8">
        <Link href="/admin/projects" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour aux projets
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Left column (2/3) */}
          <div className="lg:col-span-2 space-y-3 md:space-y-6">
            {/* Brief Client */}
            {onboarding && (
              <div className="card">
                <h3 className="font-display font-bold flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-accent" /> Brief Client
                </h3>
                {renderOrganizedBrief(onboarding.responses)}
              </div>
            )}

            {/* Prompt IA */}
            {onboarding && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-accent" /> Prompt IA
                  </h3>
                  <button
                    onClick={handleCopyPrompt}
                    disabled={promptTab === 'gemini' && !project?.ai_prompt}
                    className={`inline-flex items-center gap-1.5 text-xs font-mono px-3 py-2 rounded-lg transition-all duration-200 ${
                      (promptTab === 'base' ? promptCopied : aiPromptCopied)
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : promptTab === 'gemini' && !project?.ai_prompt
                          ? 'bg-surface-hover text-text-muted border border-surface-border cursor-not-allowed'
                          : 'bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20'
                    }`}
                  >
                    {(promptTab === 'base' ? promptCopied : aiPromptCopied) ? (
                      <><CheckCheck className="w-3.5 h-3.5" /> Copié !</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> Copier le prompt</>
                    )}
                  </button>
                </div>

                {/* Tab selector */}
                <div className="flex gap-1 mb-4 p-1 bg-surface-hover rounded-lg">
                  <button
                    onClick={() => setPromptTab('base')}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md transition-all ${
                      promptTab === 'base'
                        ? 'bg-surface text-text-primary shadow-sm'
                        : 'text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" /> Prompt de base
                  </button>
                  <button
                    onClick={() => setPromptTab('gemini')}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md transition-all ${
                      promptTab === 'gemini'
                        ? 'bg-surface text-text-primary shadow-sm'
                        : 'text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Prompt Gemini (UX/UI)
                  </button>
                </div>

                {promptTab === 'base' ? (
                  <pre className="text-xs text-text-secondary bg-surface-hover p-4 rounded-xl overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
                    {generateProjectPrompt(onboarding)}
                  </pre>
                ) : (
                  <>
                    {project?.ai_prompt ? (
                      <>
                        <pre className="text-xs text-text-secondary bg-surface-hover p-4 rounded-xl overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
                          {project.ai_prompt}
                        </pre>
                        <button
                          onClick={handleGenerateAiPrompt}
                          disabled={generatingAiPrompt}
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-surface-hover text-text-secondary border border-surface-border hover:border-accent/30 hover:text-accent transition-all"
                        >
                          {generatingAiPrompt ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Regénération en cours...</>
                          ) : (
                            <><RefreshCw className="w-3.5 h-3.5" /> Regénérer</>
                          )}
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <Sparkles className="w-8 h-8 text-text-muted mb-3" />
                        <p className="text-sm text-text-muted mb-1">Aucun prompt Gemini généré</p>
                        <p className="text-xs text-text-muted mb-4">Gemini va enrichir le prompt de base avec des directives UX/UI détaillées</p>
                        <button
                          onClick={handleGenerateAiPrompt}
                          disabled={generatingAiPrompt}
                          className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl bg-accent text-black hover:bg-accent-hover transition-all"
                        >
                          {generatingAiPrompt ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Génération en cours...</>
                          ) : (
                            <><Sparkles className="w-4 h-4" /> Générer avec Gemini</>
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Deployments */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold flex items-center gap-2">
                  <Server className="w-5 h-5 text-text-muted" /> Déploiements
                </h3>
                {project.vercel_project_id && (
                  <button onClick={() => fetchDeployments(project.vercel_project_id!, project.vercel_team_id)} className="text-xs text-accent hover:text-accent-hover flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5" /> Actualiser
                  </button>
                )}
              </div>
              {deployments.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-6">Aucun déploiement</p>
              ) : (
                <div className="space-y-2">
                  {deployments.slice(0, 8).map((d) => (
                    <a key={d.uid} href={`https://${d.url}`} target="_blank" className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-hover transition-colors">
                      {d.state === 'READY' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : d.state === 'ERROR' ? <XCircle className="w-4 h-4 text-red-400" /> : <Clock className="w-4 h-4 text-amber-400" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{d.meta?.githubCommitMessage || d.url}</p>
                        <p className="text-xs text-text-muted">{formatDateTime(new Date(d.created))}</p>
                      </div>
                      <span className="text-xs font-medium">{d.state}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Update Requests */}
            <div className="card">
              <h3 className="font-display font-bold flex items-center gap-2 mb-4">
                <RefreshCw className="w-5 h-5 text-teal-500" /> Demandes de modification ({updates.length})
              </h3>
              {updates.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">Aucune demande</p>
              ) : (
                <div className="space-y-3">
                  {updates.map((u) => (
                    <div key={u.id} className="p-3 rounded-xl border border-surface-border">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium">{u.title}</p>
                          <p className="text-xs text-text-muted">{formatDate(u.created_at)}</p>
                        </div>
                        <StatusBadge status={u.status} />
                      </div>
                      <p className="text-xs text-text-secondary mb-2">{u.description}</p>
                      {u.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateRequestStatus(u.id, 'accepted')} className="text-xs text-emerald-400 hover:underline">Accepter</button>
                          <button onClick={() => handleUpdateRequestStatus(u.id, 'rejected')} className="text-xs text-red-400 hover:underline">Refuser</button>
                        </div>
                      )}
                      {u.status === 'accepted' && (
                        <button onClick={() => handleUpdateRequestStatus(u.id, 'in_progress')} className="text-xs text-accent hover:text-accent-hover">Passer en cours</button>
                      )}
                      {u.status === 'in_progress' && (
                        <button onClick={() => handleUpdateRequestStatus(u.id, 'completed')} className="text-xs text-emerald-400 hover:underline">Marquer terminé</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column (1/3) */}
          <div className="space-y-3 md:space-y-6">
            {/* Delivery Status */}
            <div className="card">
              <h3 className="font-display font-semibold mb-3">Statut livraison</h3>
              <div className="space-y-2">
                {DELIVERY_STATUSES.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handleDeliveryStatusChange(value)}
                    disabled={savingDelivery}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      project.delivery_status === value
                        ? 'bg-accent/10 text-accent border border-accent/20'
                        : 'text-text-secondary hover:bg-surface-hover border border-transparent'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      project.delivery_status === value ? 'bg-accent' : 'bg-surface-border'
                    }`} />
                    {label}
                    {project.delivery_status === value && savingDelivery && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Client */}
            <div className="card">
              <h3 className="font-display font-semibold mb-3">Client</h3>
              {client && (
                <Link href={`/admin/clients/${project.client_id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-hover transition-colors">
                  <Avatar name={client.full_name} size="md" />
                  <div>
                    <p className="text-sm font-medium">{client.full_name}</p>
                    <p className="text-xs text-text-muted">{client.company || client.email}</p>
                  </div>
                </Link>
              )}
            </div>

            {/* Project Info */}
            <div className="card">
              <h3 className="font-display font-semibold mb-3">Informations techniques</h3>
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <label className="label">Statut</label>
                    <select className="input bg-surface border-surface-border text-text-primary" value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value as any })}>
                      {['draft', 'in_progress', 'review', 'deployed', 'maintenance', 'paused', 'archived'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Domaine</label>
                    <input type="text" className="input" value={editData.domain || ''} onChange={(e) => setEditData({ ...editData, domain: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">URL production</label>
                    <input type="url" className="input" value={editData.deployed_url || ''} onChange={(e) => setEditData({ ...editData, deployed_url: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">URL staging</label>
                    <input type="url" className="input" value={editData.staging_url || ''} onChange={(e) => setEditData({ ...editData, staging_url: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Vercel Project ID</label>
                    <input type="text" className="input" value={editData.vercel_project_id || ''} onChange={(e) => setEditData({ ...editData, vercel_project_id: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">GitHub Repo</label>
                    <input type="text" className="input" value={editData.github_repo || ''} onChange={(e) => setEditData({ ...editData, github_repo: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Notes internes</label>
                    <textarea className="input min-h-[80px] resize-y" value={editData.notes || ''} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div><span className="text-text-muted text-xs block mb-0.5">Statut</span><StatusBadge status={project.status} /></div>
                  <div><span className="text-text-muted text-xs block mb-0.5">Domaine</span>{project.domain || '—'}</div>
                  <div><span className="text-text-muted text-xs block mb-0.5">Production</span>{project.deployed_url ? <a href={project.deployed_url} className="text-accent hover:text-accent-hover" target="_blank">{project.deployed_url}</a> : '—'}</div>
                  <div><span className="text-text-muted text-xs block mb-0.5">Staging</span>{project.staging_url || '—'}</div>
                  <div><span className="text-text-muted text-xs block mb-0.5">Vercel</span>{project.vercel_project_id || '—'}</div>
                  <div><span className="text-text-muted text-xs block mb-0.5">GitHub</span>{project.github_repo ? <a href={`https://github.com/${project.github_org || ''}/${project.github_repo}`} className="text-accent hover:text-accent-hover" target="_blank">{project.github_org}/{project.github_repo}</a> : '—'}</div>
                  {project.notes && <div><span className="text-text-muted text-xs block mb-0.5">Notes</span>{project.notes}</div>}
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="card">
              <h3 className="font-display font-semibold mb-3">Liens</h3>
              <div className="space-y-2">
                {project.deployed_url && (
                  <a href={project.deployed_url} target="_blank" className="flex items-center gap-2 text-sm text-text-secondary hover:text-accent p-2 rounded-lg hover:bg-surface-hover">
                    <Globe className="w-4 h-4" /> Production <ExternalLink className="w-3 h-3 ml-auto text-text-muted" />
                  </a>
                )}
                {project.github_repo && (
                  <a href={`https://github.com/${project.github_org || ''}/${project.github_repo}`} target="_blank" className="flex items-center gap-2 text-sm text-text-secondary hover:text-accent p-2 rounded-lg hover:bg-surface-hover">
                    <Github className="w-4 h-4" /> GitHub <ExternalLink className="w-3 h-3 ml-auto text-text-muted" />
                  </a>
                )}
              </div>
            </div>

            {/* Recent Tickets */}
            <div className="card">
              <h3 className="font-display font-semibold flex items-center gap-2 mb-3">
                <LifeBuoy className="w-4 h-4 text-orange-400" /> Tickets ({tickets.length})
              </h3>
              {tickets.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center gap-2 py-2 text-sm">
                  <span className="flex-1 truncate">{t.subject}</span>
                  <StatusBadge status={t.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
