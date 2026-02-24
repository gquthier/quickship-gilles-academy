'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { TopBar } from '@/components/layout/TopBar'
import { Loader2, Save, User, Lock } from 'lucide-react'
import type { Profile } from '@/types'
import { useMobileMenu } from '../layout'

export default function SettingsPage() {
  const onMenuToggle = useMobileMenu()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (data) {
        const p = data as Profile
        setProfile(p)
        setFullName(p.full_name)
        setCompany(p.company || '')
        setPhone(p.phone || '')
      }
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSaving(true)

    await supabase.from('profiles').update({
      full_name: fullName,
      company: company || null,
      phone: phone || null,
    }).eq('id', profile.id)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPasswordSaving(true)
    setPasswordError(null)
    setPasswordSuccess(false)

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setPasswordError('Impossible de changer le mot de passe.')
    } else {
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setTimeout(() => setPasswordSuccess(false), 3000)
    }
    setPasswordSaving(false)
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
      <TopBar title="Param\u00e8tres" subtitle="G\u00e9rez votre compte" onMenuToggle={onMenuToggle} />

      <div className="p-4 md:p-8 max-w-2xl space-y-4 md:space-y-8">
        {/* Profile */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-accent" />
            <h2 className="font-display font-bold text-lg">Profil</h2>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label">Nom complet</label>
              <input type="text" className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input bg-surface-hover" value={profile.email} disabled />
              <p className="text-xs text-text-muted mt-1">Contactez le support pour modifier votre email.</p>
            </div>
            <div>
              <label className="label">Entreprise</label>
              <input type="text" className="input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Nom de votre entreprise" />
            </div>
            <div>
              <label className="label">T\u00e9l\u00e9phone</label>
              <input type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+33 6 12 34 56 78" />
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={saving} className="btn-primary gap-1.5">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saved ? 'Enregistr\u00e9 !' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>

        {/* Password */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-5 h-5 text-accent" />
            <h2 className="font-display font-bold text-lg">Mot de passe</h2>
          </div>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="label">Nouveau mot de passe</label>
              <input type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 8 caract\u00e8res" required minLength={8} />
            </div>
            {passwordError && (
              <div className="bg-red-500/10 text-red-400 text-sm px-4 py-3 rounded-xl">{passwordError}</div>
            )}
            {passwordSuccess && (
              <div className="bg-emerald-500/10 text-emerald-400 text-sm px-4 py-3 rounded-xl">Mot de passe mis \u00e0 jour avec succ\u00e8s.</div>
            )}
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={passwordSaving} className="btn-primary gap-1.5">
                {passwordSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Changer le mot de passe
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
