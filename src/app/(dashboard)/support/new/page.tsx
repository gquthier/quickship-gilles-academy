'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter, useSearchParams } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { ArrowLeft, Send, Loader2 } from 'lucide-react'
import Link from 'next/link'
type ProjectOption = { id: string; name: string }

export default function NewTicketPage() {
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [projectId, setProjectId] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [category, setCategory] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data } = await supabase
        .from('projects')
        .select('id, name')
        .eq('client_id', session.user.id)

      setProjects(data || [])

      const preselect = searchParams.get('project')
      if (preselect) setProjectId(preselect)
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { error } = await supabase.from('support_tickets').insert({
      project_id: projectId,
      client_id: session.user.id,
      subject,
      description,
      priority,
      category: category || null,
    })

    if (!error) {
      router.push('/support')
    }
    setSubmitting(false)
  }

  return (
    <>
      <TopBar title="Nouveau ticket" subtitle="Contactez notre équipe de support" />

      <div className="p-8 max-w-2xl">
        <Link href="/support" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour au support
        </Link>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Projet concerné</label>
              <select
                className="input"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
              >
                <option value="">Sélectionner un projet</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Sujet</label>
              <input
                type="text"
                className="input"
                placeholder="Résumé de votre demande"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Catégorie</label>
              <select
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Général</option>
                <option value="bug">Bug / Erreur</option>
                <option value="feature">Nouvelle fonctionnalité</option>
                <option value="design">Design / UI</option>
                <option value="performance">Performance</option>
                <option value="hosting">Hébergement</option>
                <option value="billing">Facturation</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div>
              <label className="label">Priorité</label>
              <div className="flex gap-2">
                {['low', 'medium', 'high', 'urgent'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
                      priority === p
                        ? 'bg-purple text-white'
                        : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {p === 'low' ? 'Basse' : p === 'medium' ? 'Moyenne' : p === 'high' ? 'Haute' : 'Urgente'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                className="input min-h-[150px] resize-y"
                placeholder="Décrivez votre problème ou demande en détail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/support" className="btn-secondary">Annuler</Link>
              <button type="submit" disabled={submitting} className="btn-primary gap-1.5">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Envoyer
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
