'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter, useSearchParams } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { ArrowLeft, Send, Loader2 } from 'lucide-react'
import Link from 'next/link'
type ProjectOption = { id: string; name: string }

export default function NewUpdatePage() {
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [projectId, setProjectId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data } = await supabase.from('projects').select('id, name').eq('client_id', session.user.id)
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

    const { error } = await supabase.from('update_requests').insert({
      project_id: projectId,
      client_id: session.user.id,
      title,
      description,
      priority,
    })

    if (!error) {
      router.push('/updates')
    }
    setSubmitting(false)
  }

  return (
    <>
      <TopBar title="Nouvelle demande" subtitle="Demandez une modification sur votre projet" />

      <div className="p-8 max-w-2xl">
        <Link href="/updates" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Projet</label>
              <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
                <option value="">Sélectionner un projet</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Titre de la demande</label>
              <input
                type="text"
                className="input"
                placeholder="Ex: Changer la couleur du header"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
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
                      priority === p ? 'bg-purple-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {p === 'low' ? 'Basse' : p === 'medium' ? 'Moyenne' : p === 'high' ? 'Haute' : 'Urgente'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Description détaillée</label>
              <textarea
                className="input min-h-[150px] resize-y"
                placeholder="Décrivez en détail les modifications souhaitées..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/updates" className="btn-secondary">Annuler</Link>
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
