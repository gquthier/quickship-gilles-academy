'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useAdminMobileMenu } from '@/context/admin-mobile-menu'

export default function NewClientPage() {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const onMenuToggle = useAdminMobileMenu()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/admin/create-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, full_name: fullName, company, phone, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Erreur lors de la création du client.')
      setSubmitting(false)
      return
    }

    router.push('/admin/clients')
  }

  return (
    <>
      <TopBar title="Nouveau client" subtitle="Créer un compte client" onMenuToggle={onMenuToggle} />

      <div className="p-4 md:p-8 max-w-2xl">
        <Link href="/admin/clients" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour aux clients
        </Link>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Nom complet *</label>
                <input type="text" className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Jean Dupont" />
              </div>
              <div>
                <label className="label">Entreprise</label>
                <input type="text" className="input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Ma Startup SAS" />
              </div>
            </div>

            <div>
              <label className="label">Email *</label>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="jean@startup.com" />
            </div>

            <div>
              <label className="label">Téléphone</label>
              <input type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+33 6 12 34 56 78" />
            </div>

            <div>
              <label className="label">Mot de passe initial *</label>
              <input type="text" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Mot de passe temporaire" minLength={8} />
              <p className="text-xs text-text-muted mt-1">Le client pourra le changer dans ses paramètres.</p>
            </div>

            {error && (
              <div className="bg-red-500/10 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/admin/clients" className="btn-secondary">Annuler</Link>
              <button type="submit" disabled={submitting} className="btn-primary gap-1.5">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Créer le client
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
