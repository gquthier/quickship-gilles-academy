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
      <TopBar title="Nouveau ticket" subtitle="Contactez notre \u00e9quipe de support" />

      <div className="p-8 max-w-2xl">
        <Link href="/support" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour au support
        </Link>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Projet concern&eacute;</label>
              <select
                className="input"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
              >
                <option value="">S&eacute;lectionner un projet</option>
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
                placeholder="R&eacute;sum&eacute; de votre demande"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Cat&eacute;gorie</label>
              <select
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">G&eacute;n&eacute;ral</option>
                <option value="bug">Bug / Erreur</option>
                <option value="feature">Nouvelle fonctionnalit&eacute;</option>
                <option value="design">Design / UI</option>
                <option value="performance">Performance</option>
                <option value="hosting">H&eacute;bergement</option>
                <option value="billing">Facturation</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div>
              <label className="label">Priorit&eacute;</label>
              <div className="flex gap-2">
                {['low', 'medium', 'high', 'urgent'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
                      priority === p
                        ? 'bg-accent text-black'
                        : 'bg-surface/60 text-text-secondary border border-surface-border hover:bg-surface-hover'
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
                placeholder="D&eacute;crivez votre probl&egrave;me ou demande en d&eacute;tail..."
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
