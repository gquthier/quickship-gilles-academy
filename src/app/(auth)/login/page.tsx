'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { Loader2, Zap, Shield, RefreshCw } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profile?.role === 'admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/overview')
      }
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Grid overlay decoration */}
      <div className="grid-overlay absolute inset-0 pointer-events-none" />

      {/* Accent glow behind card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-[440px] animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <span className="font-display font-extrabold text-4xl tracking-[-0.04em]">
            <span className="text-accent">Quick</span>
            <span className="text-white">Ship</span>
          </span>
        </div>

        {/* Card */}
        <div className="bg-surface/60 backdrop-blur-xl border border-surface-border rounded-2xl p-8">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="font-display font-extrabold text-[28px] tracking-[-0.03em] text-text-primary mb-2">
              Connexion
            </h1>
            <p className="text-text-secondary text-[15px]">
              Accédez à votre espace de gestion.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="vous@entreprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <input
                type="password"
                className="input"
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 text-red-400 text-[13px] font-medium px-4 py-3 rounded-2xl border border-red-500/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3.5 text-[14px]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Se connecter'
              )}
            </button>
          </form>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {[
            { icon: Zap, text: 'Suivi en temps réel' },
            { icon: Shield, text: 'Support dédié' },
            { icon: RefreshCw, text: 'Mises à jour rapides' },
          ].map((f) => (
            <div
              key={f.text}
              className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-5 py-2.5 rounded-full text-text-secondary text-[13px] font-medium"
            >
              <f.icon className="w-4 h-4 text-accent" />
              {f.text}
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <div className="flex -space-x-2">
            {['P', 'M', 'S', 'A'].map((letter, i) => (
              <div
                key={i}
                className={`w-9 h-9 rounded-full ring-2 ring-surface-border flex items-center justify-center text-[11px] font-bold text-white ${
                  ['bg-accent/80', 'bg-emerald-500/80', 'bg-blue-500/80', 'bg-rose-500/80'][i]
                }`}
              >
                {letter}
              </div>
            ))}
          </div>
          <div>
            <p className="text-text-secondary text-[13px] font-semibold">
              Rejoint par 50+ entrepreneurs
            </p>
            <p className="text-text-muted text-[11px]">
              qui font confiance à QuickShip
            </p>
          </div>
        </div>

        {/* Bottom text */}
        <p className="text-center text-[12px] text-text-muted mt-10">
          Pas de compte ? Contactez votre gestionnaire de projet.
        </p>
      </div>
    </div>
  )
}
