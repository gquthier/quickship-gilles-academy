'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { Loader2, Zap, Globe, Shield, RefreshCw } from 'lucide-react'

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
    <div className="min-h-screen flex">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900" />

        {/* Decorative circles */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/[0.06]" />
        <div className="absolute -bottom-20 -left-20 w-[350px] h-[350px] rounded-full bg-white/[0.04]" />
        <div className="absolute top-[20%] right-[15%] w-[200px] h-[200px] rounded-full bg-white/[0.03] animate-float" />
        <div className="absolute bottom-[30%] left-[10%] w-[120px] h-[120px] rounded-full bg-white/[0.03]" />

        <div className="relative z-10 flex flex-col justify-between p-16 w-full">
          {/* Top: Logo */}
          <div>
            <span className="font-display font-extrabold text-4xl tracking-[-0.04em]">
              <span className="text-amber-400">Quick</span>
              <span className="text-white">Ship</span>
            </span>
          </div>

          {/* Center: Hero text */}
          <div>
            <h2 className="font-display font-extrabold text-[42px] text-white leading-[1.08] tracking-[-0.04em] mb-5">
              Votre espace de<br />
              gestion de projet<br />
              <span className="text-amber-400">web</span>
            </h2>
            <p className="text-white/60 text-lg max-w-md leading-relaxed font-body">
              Suivez vos projets en temps réel, demandez des modifications
              et contactez notre équipe en un clic.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3 mt-10">
              {[
                { icon: Zap, text: 'Suivi en temps réel' },
                { icon: Shield, text: 'Support dédié' },
                { icon: RefreshCw, text: 'Mises à jour rapides' },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-2.5 bg-white/[0.1] backdrop-blur-xl border border-white/[0.1] px-5 py-2.5 rounded-full text-white/90 text-[13px] font-medium">
                  <f.icon className="w-4 h-4 text-amber-400" />
                  {f.text}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: Social proof */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {['P', 'M', 'S', 'A'].map((letter, i) => (
                <div key={i} className={`w-9 h-9 rounded-full ring-2 ring-purple-700 flex items-center justify-center text-[11px] font-bold text-white ${['bg-amber-500', 'bg-emerald-500', 'bg-blue-500', 'bg-rose-500'][i]}`}>
                  {letter}
                </div>
              ))}
            </div>
            <div>
              <p className="text-white/80 text-[13px] font-semibold">Rejoint par 50+ entrepreneurs</p>
              <p className="text-white/40 text-[11px]">qui font confiance à QuickShip</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-8 bg-[#F8F9FC]">
        <div className="w-full max-w-[400px] animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10 text-center">
            <span className="font-display font-extrabold text-3xl tracking-[-0.04em]">
              <span className="text-purple-600">Quick</span>
              <span className="text-gray-900">Ship</span>
            </span>
          </div>

          <div className="mb-8">
            <h1 className="font-display font-extrabold text-[28px] tracking-[-0.03em] text-gray-900 mb-2">
              Connexion
            </h1>
            <p className="text-gray-500 text-[15px]">
              Accédez à votre espace de gestion.
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
              <div className="bg-red-50 text-red-600 text-[13px] font-medium px-4 py-3 rounded-2xl ring-1 ring-red-200/50">
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

          <p className="text-center text-[12px] text-gray-400 mt-10">
            Pas de compte ? Contactez votre gestionnaire de projet.
          </p>
        </div>
      </div>
    </div>
  )
}
