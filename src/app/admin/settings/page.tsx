'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { TopBar } from '@/components/layout/TopBar'
import { Loader2, Save, User, Key, Globe, Bell } from 'lucide-react'
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

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <TopBar title="Paramètres" subtitle="Configuration de la plateforme" />

      <div className="p-8 max-w-2xl space-y-8">
        {/* Admin Profile */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-purple" />
            <h2 className="font-display font-bold text-lg">Profil admin</h2>
          </div>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="label">Nom</label>
              <input type="text" className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input bg-slate-50" value={profile.email} disabled />
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
            <Key className="w-5 h-5 text-purple" />
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
              <p className="text-xs text-slate-400 mt-1">Utilisé pour récupérer les statuts de déploiement.</p>
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
              <p className="text-xs text-slate-400 mt-1">Utilisé pour accéder aux repositories clients.</p>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={tokensSaving} className="btn-primary gap-1.5">
                {tokensSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {tokensSaved ? 'Enregistré !' : 'Sauvegarder les tokens'}
              </button>
            </div>
          </form>
        </div>

        {/* Platform Settings */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-purple" />
            <h2 className="font-display font-bold text-lg">Configuration plateforme</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">Domaine de la plateforme</label>
              <input type="text" className="input bg-slate-50" value="app.quickship.fr" disabled />
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
            <Bell className="w-5 h-5 text-purple" />
            <h2 className="font-display font-bold text-lg">Notifications</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Nouveau ticket de support', description: 'Recevoir un email à chaque nouveau ticket' },
              { label: 'Nouvelle demande de modification', description: 'Recevoir un email pour chaque demande client' },
              { label: 'Nouveau client inscrit', description: 'Être notifié quand un nouveau client est créé' },
              { label: 'Erreur de déploiement', description: 'Alerte si un déploiement Vercel échoue' },
            ].map((notif, i) => (
              <label key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-slate-900">{notif.label}</p>
                  <p className="text-xs text-slate-400">{notif.description}</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-purple focus:ring-purple accent-purple" />
              </label>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
