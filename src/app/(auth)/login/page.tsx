'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { Loader2, Zap } from 'lucide-react'

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

    // Fetch role to redirect
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profile?.role === 'admin') {
        router.push('/dashboard')
      } else {
        router.push('/overview')
      }
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple via-purple-dark to-purple-darker relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute top-1/4 right-1/4 w-48 h-48 rounded-full bg-white/3" />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="mb-8">
            <span className="font-display font-extrabold text-4xl tracking-tight text-white">
              Quick<span className="text-accent-yellow">Ship</span>
            </span>
          </div>
          <h2 className="font-display font-bold text-3xl text-white leading-tight mb-4">
            Votre espace de gestion<br />de projet web
          </h2>
          <p className="text-white/70 text-lg max-w-md leading-relaxed">
            Suivez vos projets en temps réel, demandez des modifications
            et contactez notre équipe en un clic.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 mt-8">
            {['Suivi en temps réel', 'Support dédié', 'Mises à jour rapides'].map((f) => (
              <div key={f} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
                <Zap className="w-4 h-4 text-accent-yellow" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <span className="font-display font-extrabold text-3xl tracking-tight">
              <span className="text-purple">Quick</span>
              <span className="text-slate-900">Ship</span>
            </span>
          </div>

          <div className="mb-8">
            <h1 className="font-display font-bold text-2xl text-slate-900 mb-2">
              Connexion
            </h1>
            <p className="text-slate-500">
              Accédez à votre espace de gestion QuickShip.
            </p>
          </div>

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
              <div className="bg-red-50 text-accent-red text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3.5"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8">
            Vous n'avez pas de compte ? Contactez votre gestionnaire de projet.
          </p>
        </div>
      </div>
    </div>
  )
}
