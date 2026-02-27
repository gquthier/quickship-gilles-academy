'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { TopBar } from '@/components/layout/TopBar'
import {
  BarChart3,
  Mail,
  CheckCircle,
  Circle,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Globe,
  MessageSquare,
  Zap,
  AlertCircle,
  Plug,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useMobileMenu } from '@/context/mobile-menu'

interface ProjectIntegration {
  projectId: string
  projectName: string
  gaConnected: boolean
  gaMeasurementId: string | null
  contactFormConnected: boolean
  contactFormEndpoint: string | null
}

type CopyState = Record<string, boolean>

export default function IntegrationsPage() {
  const onMenuToggle = useMobileMenu()
  const supabase = createClient()
  const [projects, setProjects] = useState<ProjectIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<CopyState>({})

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, metadata')
        .eq('client_id', session.user.id)
        .order('created_at', { ascending: false })

      if (projectsData) {
        setProjects(projectsData.map(p => {
          const meta = (p.metadata as Record<string, unknown>) || {}
          return {
            projectId: p.id,
            projectName: p.name,
            gaConnected: Boolean(meta.ga_measurement_id),
            gaMeasurementId: (meta.ga_measurement_id as string) || null,
            contactFormConnected: Boolean(meta.contact_form_endpoint),
            contactFormEndpoint: (meta.contact_form_endpoint as string) || null,
          }
        }))
      }

      setLoading(false)
    }
    load()
  }, [])

  async function copyToClipboard(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(prev => ({ ...prev, [key]: true }))
    setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-[3px] border-surface-border border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  const connectedGA = projects.filter(p => p.gaConnected).length
  const connectedForms = projects.filter(p => p.contactFormConnected).length

  return (
    <>
      <TopBar title="Intégrations" subtitle="Connectez vos outils à votre site" onMenuToggle={onMenuToggle} />

      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
            <Plug className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">Connexions</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl text-text-primary tracking-tight mb-2">
            Intégrations
          </h1>
          <p className="text-text-secondary text-sm max-w-xl">
            Connectez Google Analytics et votre formulaire de contact pour suivre vos performances et capturer vos leads.
          </p>
        </div>

        {/* Stats */}
        {projects.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="card border-blue-500/20 bg-blue-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Analytics</span>
              </div>
              <p className="text-2xl font-display font-extrabold text-text-primary">{connectedGA}/{projects.length}</p>
              <p className="text-xs text-text-muted">projets connectés</p>
            </div>
            <div className="card border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Formulaires</span>
              </div>
              <p className="text-2xl font-display font-extrabold text-text-primary">{connectedForms}/{projects.length}</p>
              <p className="text-xs text-text-muted">projets connectés</p>
            </div>
          </div>
        )}

        {/* ── Section 1: Google Analytics ── */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-text-primary">Google Analytics 4</h2>
              <p className="text-xs text-text-muted">Suivez les visites, le comportement et les conversions</p>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="card text-center py-10">
              <Globe className="w-8 h-8 text-text-muted mx-auto mb-3" />
              <p className="text-sm text-text-muted">Aucun projet actif — créez un projet pour connecter Analytics.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((p) => (
                <div key={`ga-${p.projectId}`} className={cn(
                  'card p-5 border transition-colors',
                  p.gaConnected ? 'border-blue-500/20 bg-blue-500/5' : 'border-surface-border'
                )}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {p.gaConnected
                        ? <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                        : <Circle className="w-5 h-5 text-text-muted flex-shrink-0" />
                      }
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-text-primary truncate">{p.projectName}</p>
                        {p.gaConnected && p.gaMeasurementId ? (
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-[11px] text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded">
                              {p.gaMeasurementId}
                            </code>
                            <button
                              onClick={() => copyToClipboard(p.gaMeasurementId!, `ga-${p.projectId}`)}
                              className="text-text-muted hover:text-text-primary transition-colors"
                            >
                              {copied[`ga-${p.projectId}`]
                                ? <Check className="w-3 h-3 text-accent" />
                                : <Copy className="w-3 h-3" />
                              }
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-text-muted mt-0.5">Non connecté</p>
                        )}
                      </div>
                    </div>
                    <Link
                      href="/support/new"
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex-shrink-0',
                        p.gaConnected
                          ? 'text-text-muted border border-surface-border hover:border-text-muted hover:text-text-secondary'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20'
                      )}
                    >
                      {p.gaConnected ? 'Modifier' : 'Connecter'}
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* GA Setup guide */}
          <div className="mt-4 card border-surface-border p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-text-primary mb-2">Comment connecter Google Analytics ?</p>
                <ol className="space-y-1.5 text-sm text-text-secondary">
                  <li className="flex gap-2">
                    <span className="text-accent font-bold">1.</span>
                    Créez une propriété GA4 sur
                    <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline inline-flex items-center gap-1">
                      analytics.google.com <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent font-bold">2.</span>
                    Copiez votre Measurement ID (format G-XXXXXXX)
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent font-bold">3.</span>
                    Ouvrez un ticket support avec votre ID — on l&apos;intègre en 24h
                  </li>
                </ol>
                <Link
                  href="/support/new"
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-accent text-bg rounded-lg text-sm font-semibold hover:bg-accent-hover transition-all duration-200"
                >
                  Demander l&apos;intégration GA4
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 2: Contact Form ── */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-text-primary">Formulaire de contact</h2>
              <p className="text-xs text-text-muted">Recevez les leads de votre site directement dans votre boîte</p>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="card text-center py-10">
              <MessageSquare className="w-8 h-8 text-text-muted mx-auto mb-3" />
              <p className="text-sm text-text-muted">Aucun projet actif.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((p) => (
                <div key={`form-${p.projectId}`} className={cn(
                  'card p-5 border transition-colors',
                  p.contactFormConnected ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-surface-border'
                )}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {p.contactFormConnected
                        ? <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        : <Circle className="w-5 h-5 text-text-muted flex-shrink-0" />
                      }
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-text-primary truncate">{p.projectName}</p>
                        {p.contactFormConnected && p.contactFormEndpoint ? (
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-[11px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded truncate max-w-[200px]">
                              {p.contactFormEndpoint}
                            </code>
                            <button
                              onClick={() => copyToClipboard(p.contactFormEndpoint!, `form-${p.projectId}`)}
                              className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
                            >
                              {copied[`form-${p.projectId}`]
                                ? <Check className="w-3 h-3 text-accent" />
                                : <Copy className="w-3 h-3" />
                              }
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-text-muted mt-0.5">Non configuré</p>
                        )}
                      </div>
                    </div>
                    <Link
                      href="/support/new"
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex-shrink-0',
                        p.contactFormConnected
                          ? 'text-text-muted border border-surface-border hover:border-text-muted hover:text-text-secondary'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                      )}
                    >
                      {p.contactFormConnected ? 'Modifier' : 'Configurer'}
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Form webhook explainer */}
          <div className="mt-4 card border-surface-border p-5">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-text-primary mb-2">Comment ça marche ?</p>
                <p className="text-sm text-text-secondary mb-3">
                  On configure un webhook sur votre formulaire de contact — chaque soumission vous est envoyée par email et apparaît dans votre tableau de bord.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Notif email immédiate', 'Historique dans QuickShip', 'Anti-spam inclus', 'Compatible tous CMS'].map(f => (
                    <span key={f} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-surface-hover text-text-secondary border border-surface-border">
                      <CheckCircle className="w-3 h-3 text-accent" />
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 3: Coming soon ── */}
        <div>
          <h2 className="font-display font-bold text-base text-text-muted mb-4 uppercase tracking-wider">Bientôt disponible</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: BarChart3, label: 'Google Search Console', desc: 'Indexation et mots-clés', color: 'text-blue-400' },
              { icon: MessageSquare, label: 'Chat en ligne', desc: 'Tawk.to / Crisp intégré', color: 'text-purple-400' },
              { icon: Mail, label: 'Email marketing', desc: 'Mailchimp / Brevo', color: 'text-orange-400' },
              { icon: Globe, label: 'Facebook Pixel', desc: 'Suivi des conversions Meta', color: 'text-blue-400' },
            ].map(({ icon: Icon, label, desc, color }) => (
              <div key={label} className="card p-4 border-dashed opacity-60">
                <div className="flex items-center gap-3">
                  <Icon className={cn('w-5 h-5', color)} />
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{label}</p>
                    <p className="text-xs text-text-muted">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  )
}

