'use client'

import { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import {
  ExternalLink,
  ArrowRight,
  MessageCircle,
  Star,
  Zap,
  Gift,
  Users,
  Send,
  Check,
  BarChart3,
  Globe,
  TrendingUp,
  MessageSquareDashed,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useMobileMenu } from '@/context/mobile-menu'

const LAZYRANK_URL = 'https://www.lazyrank.io'
const GHL_URL = 'https://www.gohighlevel.com/?fp_ref=gauthier93'
const WA_MESSAGE = encodeURIComponent(
  "Salut ! Je travaille avec QuickShip pour mon site web et c'est top. Je pense que ça pourrait t'intéresser si tu cherches quelqu'un pour créer ton site ou app. Tu veux que je te mette en contact ? 🚀"
)
const WA_LINK = `https://wa.me/?text=${WA_MESSAGE}`
const AVIS_GOOGLE_URL = 'https://g.page/r/quickship/review'

const FEEDBACK_CATEGORIES = [
  { value: 'plateforme', label: 'La plateforme' },
  { value: 'projet', label: 'Mon projet' },
  { value: 'communication', label: 'La communication' },
  { value: 'resultats', label: 'Les résultats' },
  { value: 'autre', label: 'Autre' },
]

type Tab = 'recommande' | 'nous-aider'

function FeedbackForm() {
  const [category, setCategory] = useState('plateforme')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!message.trim()) { setError("Merci d'écrire un message."); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/client/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, category }),
      })
      if (!res.ok) throw new Error('Erreur serveur')
      setSent(true)
      setMessage('')
    } catch {
      setError('Une erreur est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="p-8 flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Check className="w-7 h-7 text-accent" />
        </div>
        <p className="font-display font-bold text-lg text-text-primary">Merci pour votre retour !</p>
        <p className="text-sm text-text-secondary">Votre feedback a bien été transmis à l'équipe QuickShip.</p>
        <button
          onClick={() => setSent(false)}
          className="text-xs text-accent hover:text-accent-hover mt-2"
        >
          Envoyer un autre message
        </button>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3 space-y-4">
          <p className="text-sm text-text-secondary">
            Votre avis compte. Dites-nous ce que vous pensez de l'outil, de la collaboration, ou ce que nous pourrions améliorer.
          </p>

          <div>
            <label className="text-xs font-medium text-text-muted mb-2 block uppercase tracking-wider">
              Sujet
            </label>
            <div className="flex flex-wrap gap-2">
              {FEEDBACK_CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={cn(
                    'text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-200',
                    category === c.value
                      ? 'bg-accent text-bg border-accent'
                      : 'text-text-muted border-surface-border hover:border-text-muted hover:text-text-secondary'
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted mb-2 block uppercase tracking-wider">
              Votre message *
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => { setMessage(e.target.value); setError(null) }}
              placeholder="Ce qui fonctionne bien, ce qui pourrait être amélioré, une idée de feature..."
              className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors resize-none"
            />
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !message.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent text-bg rounded-lg text-sm font-semibold hover:bg-accent-hover transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? 'Envoi…' : 'Envoyer mon feedback'}
          </button>
        </div>

        <div className="lg:col-span-2">
          <div className="card border-accent/20 bg-accent/5 p-5">
            <MessageSquareDashed className="w-6 h-6 text-accent mb-3" />
            <p className="text-sm font-semibold text-text-primary mb-3">Pourquoi votre avis est précieux</p>
            <ul className="space-y-2">
              {[
                'Chaque retour est lu par l\'équipe',
                'On améliore l\'outil grâce à vous',
                'Vos idées peuvent devenir des features',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                  <div className="w-4 h-4 rounded bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 text-accent" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HubPage() {
  const onMenuToggle = useMobileMenu()
  const [tab, setTab] = useState<Tab>('recommande')

  return (
    <>
      <TopBar title="Hub" subtitle="Ressources et outils recommandés" onMenuToggle={onMenuToggle} />

      <div className="p-4 md:p-8 max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-4">
            <Zap className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-medium text-accent uppercase tracking-wider">Espace ressources</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl text-text-primary tracking-tight mb-2">
            Votre hub QuickShip
          </h1>
          <p className="text-text-secondary text-sm max-w-xl">
            Outils recommandés pour booster votre présence en ligne et façons de nous soutenir.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl border border-surface-border overflow-hidden mb-8">
          <button
            onClick={() => setTab('recommande')}
            className={cn(
              'flex-1 py-3 text-sm font-semibold transition-all duration-200',
              tab === 'recommande'
                ? 'bg-accent text-bg'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
            )}
          >
            ⭐ Recommandé
          </button>
          <button
            onClick={() => setTab('nous-aider')}
            className={cn(
              'flex-1 py-3 text-sm font-semibold transition-all duration-200 border-l border-surface-border',
              tab === 'nous-aider'
                ? 'bg-accent text-bg'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
            )}
          >
            🎁 Nous aider
          </button>
        </div>

        {/* ═══════════════════════════════ */}
        {/* TAB 1 — RECOMMANDÉ             */}
        {/* ═══════════════════════════════ */}
        {tab === 'recommande' && (
          <div className="space-y-5">

            {/* ── 01. Lazyrank.io ── */}
            <div className="card p-0 overflow-hidden">
              <div className="bg-accent/10 border-b border-surface-border p-6 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-text-muted uppercase tracking-widest mb-0.5">Offre partenaire</p>
                    <h2 className="text-xl font-display font-bold text-text-primary">Lazyrank.io</h2>
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 uppercase tracking-wide">
                  01
                </span>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
                <div className="lg:col-span-3">
                  <p className="text-sm text-text-secondary mb-4">
                    <strong className="text-text-primary">Lazyrank.io</strong> génère automatiquement des articles de blog optimisés SEO et les publie directement sur votre site web.
                  </p>
                  <ul className="space-y-2 mb-5">
                    {[
                      'Articles rédigés par IA sur vos mots-clés prioritaires',
                      'Intégration directe sur WordPress, Webflow, Next.js',
                      'Boostez votre référencement naturel sans effort',
                      'Complément parfait à votre site QuickShip',
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                        <div className="w-4 h-4 rounded bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <Check className="w-2.5 h-2.5 text-accent" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="lg:col-span-2 space-y-3">
                  <div className="card border-accent/20 bg-accent/5 p-4">
                    <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">Offre partenaire exclusive</p>
                    <p className="text-sm font-semibold text-text-primary mb-1">
                      Tarif préférentiel réservé aux clients QuickShip
                    </p>
                    <p className="text-xs text-text-muted">
                      Mentionnez QuickShip lors de votre inscription.
                    </p>
                  </div>
                  <a
                    href={LAZYRANK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-accent text-bg rounded-xl text-sm font-semibold hover:bg-accent-hover transition-all duration-200"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visiter Lazyrank.io
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* ── 02. Google Analytics ── */}
            <div className="card p-0 overflow-hidden">
              <div className="bg-blue-500/10 border-b border-surface-border p-6 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-text-muted uppercase tracking-widest mb-0.5">Intégration recommandée</p>
                    <h2 className="text-xl font-display font-bold text-text-primary">Google Analytics 4</h2>
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wide">
                  02
                </span>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
                <div className="lg:col-span-3">
                  <p className="text-sm text-text-secondary mb-4">
                    Suivez les performances de votre site en temps réel : visiteurs, pages vues, taux de conversion et sources de trafic.
                  </p>
                  <ul className="space-y-2 mb-5">
                    {[
                      'Trafic en temps réel et historique',
                      'Analyse des pages les plus visitées',
                      'Suivi des conversions et objectifs',
                      'Rapports mensuels automatiques',
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                        <div className="w-4 h-4 rounded bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <Check className="w-2.5 h-2.5 text-blue-400" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="lg:col-span-2 space-y-3">
                  <div className="card border-blue-500/20 bg-blue-500/5 p-4">
                    <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">Inclus dans votre plan</p>
                    <p className="text-sm font-semibold text-text-primary mb-1">
                      Intégration GA4 incluse dans votre projet
                    </p>
                    <p className="text-xs text-text-muted">
                      Demandez l'activation via un ticket support.
                    </p>
                  </div>
                  <Link
                    href="/support/new"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl text-sm font-semibold hover:bg-blue-500/20 transition-all duration-200"
                  >
                    Demander l&apos;intégration
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* ── 03. GoHighLevel CRM ── */}
            <div className="card p-0 overflow-hidden">
              <div className="bg-purple-500/10 border-b border-surface-border p-6 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-text-muted uppercase tracking-widest mb-0.5">Outil recommandé</p>
                    <h2 className="text-xl font-display font-bold text-text-primary">GoHighLevel CRM</h2>
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wide">
                  03
                </span>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
                <div className="lg:col-span-3">
                  <p className="text-sm text-text-secondary mb-4">
                    Un <strong className="text-text-primary">CRM complet</strong> pour gérer vos contacts, automatiser vos suivis et maximiser les leads générés par votre site.
                  </p>
                  <ul className="space-y-2 mb-5">
                    {[
                      'Gestion complète de vos contacts',
                      'Automatisations email & SMS',
                      'Pipeline de vente visuel',
                      'Idéal pour les formulaires de contact',
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                        <div className="w-4 h-4 rounded bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                          <Check className="w-2.5 h-2.5 text-purple-400" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="lg:col-span-2 space-y-3">
                  <div className="card border-purple-500/20 bg-purple-500/5 p-4">
                    <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">Recommandé par QuickShip</p>
                    <p className="text-sm font-semibold text-text-primary mb-1">
                      Le CRM n°1 pour les PMEs qui veulent convertir plus
                    </p>
                  </div>
                  <a
                    href={GHL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl text-sm font-semibold hover:bg-purple-500/20 transition-all duration-200"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Essayer GoHighLevel
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ═══════════════════════════════ */}
        {/* TAB 2 — NOUS AIDER             */}
        {/* ═══════════════════════════════ */}
        {tab === 'nous-aider' && (
          <div className="space-y-5">

            {/* ── 01. Avis Google ── */}
            <div className="card p-0 overflow-hidden">
              <div className="bg-amber-500/10 border-b border-surface-border p-6 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                    <Star className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-text-muted uppercase tracking-widest mb-0.5">Donnez votre avis</p>
                    <h2 className="text-xl font-display font-bold text-text-primary">Avis Google</h2>
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wide">
                  01
                </span>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
                <div className="lg:col-span-3">
                  <p className="text-sm text-text-secondary mb-4">
                    Laissez-nous un avis Google — ça prend <strong className="text-text-primary">2 minutes</strong> et ça nous aide énormément à attirer de nouveaux clients.
                  </p>
                  <p className="text-sm text-text-muted mb-5">
                    Partagez votre expérience : la qualité du site livré, la rapidité, la communication...
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Star className="w-3 h-3" />
                      Simple &amp; rapide
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-surface-hover text-text-muted border border-surface-border">
                      <Zap className="w-3 h-3" />
                      2 minutes max
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-3">
                  <div className="card border-amber-500/20 bg-amber-500/5 p-4">
                    <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">Ce que vous recevez</p>
                    <div className="flex items-start gap-3">
                      <Gift className="w-7 h-7 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-text-primary mb-1">
                          1 mois offert sur votre abonnement
                        </p>
                        <p className="text-xs text-text-muted">
                          Envoyez-nous votre capture d'écran après publication.
                        </p>
                      </div>
                    </div>
                  </div>
                  <a
                    href={AVIS_GOOGLE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-400 transition-all duration-200"
                  >
                    <Star className="w-4 h-4" />
                    Laisser un avis Google
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* ── 02. Recommandation ── */}
            <div className="card p-0 overflow-hidden">
              <div className="bg-emerald-500/10 border-b border-surface-border p-6 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-text-muted uppercase tracking-widest mb-0.5">Parlez-en autour de vous</p>
                    <h2 className="text-xl font-display font-bold text-text-primary">Recommandez-nous</h2>
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">
                  02
                </span>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
                <div className="lg:col-span-3">
                  <p className="text-sm text-text-secondary mb-4">
                    Vous connaissez quelqu&apos;un qui cherche à <strong className="text-text-primary">créer son site ou son application ?</strong>
                  </p>
                  <p className="text-sm text-text-muted mb-5">
                    Faites une simple intro sur WhatsApp — on s&apos;occupe du reste. Aucun engagement de votre part.
                  </p>
                  <div className="flex items-start gap-3 p-4 bg-surface-hover rounded-xl border border-surface-border">
                    <MessageCircle className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-text-muted italic">
                      &ldquo;Salut ! Je travaille avec QuickShip pour mon site — résultats au top, je pense que ça t&apos;intéresserait&hellip;&rdquo;
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-3">
                  <div className="card border-emerald-500/20 bg-emerald-500/5 p-4">
                    <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">Pour chaque recommandation signée</p>
                    <div className="flex items-end gap-2 mb-1">
                      <span className="text-3xl font-display font-extrabold text-emerald-400 leading-none">−1 mois</span>
                    </div>
                    <p className="text-xs text-text-muted">sur votre prochain abonnement</p>
                  </div>
                  <a
                    href={WA_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#25D366] text-white rounded-xl text-sm font-semibold hover:bg-[#22c55e] transition-all duration-200"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Faire une intro WhatsApp
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* ── 03. Feedback ── */}
            <div className="card p-0 overflow-hidden">
              <div className="bg-surface-hover border-b border-surface-border p-6 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-surface-border flex items-center justify-center flex-shrink-0">
                    <MessageSquareDashed className="w-5 h-5 text-text-secondary" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-text-muted uppercase tracking-widest mb-0.5">Votre avis nous aide à progresser</p>
                    <h2 className="text-xl font-display font-bold text-text-primary">Feedback &amp; Suggestions</h2>
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full bg-surface-border text-text-muted uppercase tracking-wide">
                  03
                </span>
              </div>
              <FeedbackForm />
            </div>

          </div>
        )}

      </div>
    </>
  )
}
