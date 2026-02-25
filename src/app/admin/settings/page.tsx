'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { TopBar } from '@/components/layout/TopBar'
import { Loader2, Save, User, Key, Globe, Bell, Sparkles, Eye, EyeOff } from 'lucide-react'
import { useAdminMobileMenu } from '../layout'
import type { Profile } from '@/types'

export default function AdminSettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [vercelToken, setVercelToken] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [tokensSaving, setTokensSaving] = useState(false)
  const [tokensSaved, setTokensSaved] = useState(false)

  const [geminiKey, setGeminiKey] = useState('')
  const [geminiKeyPreview, setGeminiKeyPreview] = useState<string | null>(null)
  const [hasGeminiKey, setHasGeminiKey] = useState(false)
  const [showGeminiKey, setShowGeminiKey] = useState(false)
  const [geminiSaving, setGeminiSaving] = useState(false)
  const [geminiSaved, setGeminiSaved] = useState(false)
  const [geminiError, setGeminiError] = useState('')

  const onMenuToggle = useAdminMobileMenu()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (data) {
        setProfile(data as Profile)
        setFullName(data.full_name)
      }

      // Load AI settings
      const settingsRes = await fetch('/api/admin/settings')
      if (settingsRes.ok) {
        const s = await settingsRes.json()
        setHasGeminiKey(s.has_gemini_key)
        setGeminiKeyPreview(s.gemini_key_preview)
      }
    }
    load()
  }, [])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    await supabase.from('profiles').update({ full_name: fullName }).eq('id', profile.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleSaveTokens(e: React.FormEvent) {
    e.preventDefault()
    setTokensSaving(true)
    // In production, store these securely (e.g., encrypted in DB or use env vars)
    // For now, we'll save to an admin_settings table or just show the UI
    setTokensSaving(false)
    setTokensSaved(true)
    setTimeout(() => setTokensSaved(false), 3000)
  }

  async function handleSaveGeminiKey(e: React.FormEvent) {
    e.preventDefault()
    setGeminiError('')
    if (!geminiKey && !hasGeminiKey) return
    setGeminiSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gemini_key: geminiKey }),
      })
      if (!res.ok) {
        const err = await res.json()
        setGeminiError(err.error || 'Erreur sauvegarde')
        return
      }
      setHasGeminiKey(geminiKey.length > 0)
      setGeminiKeyPreview(geminiKey ? geminiKey.slice(0, 8) + '••••••••••••••••••••' : null)
      setGeminiKey('')
      setGeminiSaved(true)
      setTimeout(() => setGeminiSaved(false), 3000)
    } finally {
      setGeminiSaving(false)
    }
  }

  async function handleDeleteGeminiKey() {
    setGeminiSaving(true)
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gemini_key: '' }),
    })
    setHasGeminiKey(false)
    setGeminiKeyPreview(null)
    setGeminiKey('')
    setGeminiSaving(false)
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-[3px] border-surface-border border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <TopBar title="Paramètres" subtitle="Configuration de la plateforme" onMenuToggle={onMenuToggle} />

      <div className="p-4 md:p-8 max-w-2xl space-y-4 md:space-y-8">
        {/* Admin Profile */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-accent" />
            <h2 className="font-display font-bold text-lg">Profil admin</h2>
          </div>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="label">Nom</label>
              <input type="text" className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input bg-surface-hover" value={profile.email} disabled />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="btn-primary gap-1.5">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saved ? 'Enregistré !' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>

        {/* API Tokens */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Key className="w-5 h-5 text-accent" />
            <h2 className="font-display font-bold text-lg">Tokens API</h2>
          </div>
          <form onSubmit={handleSaveTokens} className="space-y-4">
            <div>
              <label className="label">Token Vercel</label>
              <input
                type="password"
                className="input"
                value={vercelToken}
                onChange={(e) => setVercelToken(e.target.value)}
                placeholder="Votre token Vercel API"
              />
              <p className="text-xs text-text-muted mt-1">Utilisé pour récupérer les statuts de déploiement.</p>
            </div>
            <div>
              <label className="label">Token GitHub</label>
              <input
                type="password"
                className="input"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="Votre token GitHub (PAT)"
              />
              <p className="text-xs text-text-muted mt-1">Utilisé pour accéder aux repositories clients.</p>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={tokensSaving} className="btn-primary gap-1.5">
                {tokensSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {tokensSaved ? 'Enregistré !' : 'Sauvegarder les tokens'}
              </button>
            </div>
          </form>
        </div>

        {/* AI Settings */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-5 h-5 text-accent" />
            <h2 className="font-display font-bold text-lg">Intelligence artificielle</h2>
          </div>
          <form onSubmit={handleSaveGeminiKey} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label">Clé API Google Gemini</label>
                {hasGeminiKey && (
                  <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Configurée
                  </span>
                )}
              </div>
              {hasGeminiKey && !geminiKey && (
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-xs text-text-muted font-mono bg-surface-hover px-3 py-2 rounded-lg flex-1">
                    {geminiKeyPreview}
                  </code>
                  <button
                    type="button"
                    onClick={handleDeleteGeminiKey}
                    disabled={geminiSaving}
                    className="text-xs text-red-400 hover:text-red-300 px-3 py-2 border border-red-400/30 hover:border-red-400/60 rounded-lg transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              )}
              <div className="relative">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  className="input pr-10"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder={hasGeminiKey ? 'Nouvelle clé pour remplacer…' : 'AIzaSy…'}
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-text-muted mt-1">
                Utilisée pour enrichir les prompts IA via Gemini.{' '}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Obtenir une clé →
                </a>
              </p>
              {geminiError && <p className="text-xs text-red-400 mt-1">{geminiError}</p>}
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={geminiSaving || !geminiKey}
                className="btn-primary gap-1.5"
              >
                {geminiSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {geminiSaved ? 'Enregistrée !' : 'Sauvegarder la clé'}
              </button>
            </div>
          </form>
        </div>

        {/* Platform Settings */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-accent" />
            <h2 className="font-display font-bold text-lg">Configuration plateforme</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">Domaine de la plateforme</label>
              <input type="text" className="input bg-surface-hover" value="app.quickship.fr" disabled />
            </div>
            <div>
              <label className="label">Organisation GitHub par défaut</label>
              <input type="text" className="input" placeholder="quickship-agency" />
            </div>
            <div>
              <label className="label">Vercel Team ID par défaut</label>
              <input type="text" className="input" placeholder="team_..." />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-accent" />
            <h2 className="font-display font-bold text-lg">Notifications</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Nouveau ticket de support', description: 'Recevoir un email à chaque nouveau ticket' },
              { label: 'Nouvelle demande de modification', description: 'Recevoir un email pour chaque demande client' },
              { label: 'Nouveau client inscrit', description: 'Être notifié quand un nouveau client est créé' },
              { label: 'Erreur de déploiement', description: 'Alerte si un déploiement Vercel échoue' },
            ].map((notif, i) => (
              <label key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-hover cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-text-primary">{notif.label}</p>
                  <p className="text-xs text-text-muted">{notif.description}</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-accent focus:ring-accent accent-accent" />
              </label>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
