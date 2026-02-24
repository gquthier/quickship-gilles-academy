'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter, useSearchParams } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { ArrowLeft, FolderPlus, Loader2 } from 'lucide-react'
import Link from 'next/link'
type ClientOption = { id: string; full_name: string; company: string | null }

export default function NewProjectPage() {
  const [clients, setClients] = useState<ClientOption[]>([])
  const [clientId, setClientId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [domain, setDomain] = useState('')
  const [vercelProjectId, setVercelProjectId] = useState('')
  const [vercelTeamId, setVercelTeamId] = useState('')
  const [githubRepo, setGithubRepo] = useState('')
  const [githubOrg, setGithubOrg] = useState('')
  const [deployedUrl, setDeployedUrl] = useState('')
  const [stagingUrl, setStagingUrl] = useState('')
  const [techStack, setTechStack] = useState('')
  const [status, setStatus] = useState('draft')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('profiles').select('id, full_name, company').eq('role', 'client').order('full_name')
      setClients(data || [])

      const preselect = searchParams.get('client')
      if (preselect) setClientId(preselect)
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const { error } = await supabase.from('projects').insert({
      client_id: clientId,
      name,
      description: description || null,
      domain: domain || null,
      vercel_project_id: vercelProjectId || null,
      vercel_team_id: vercelTeamId || null,
      github_repo: githubRepo || null,
      github_org: githubOrg || null,
      deployed_url: deployedUrl || null,
      staging_url: stagingUrl || null,
      tech_stack: techStack ? techStack.split(',').map(s => s.trim()) : [],
      status,
    })

    if (!error) {
      router.push('/admin/projects')
    }
    setSubmitting(false)
  }

  return (
    <>
      <TopBar title="Nouveau projet" subtitle="Créer un projet client" />

      <div className="p-8 max-w-3xl">
        <Link href="/admin/projects" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour aux projets
        </Link>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General */}
            <div>
              <h3 className="font-display font-semibold text-sm text-slate-900 mb-4">Informations générales</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Client *</label>
                  <select className="input" value={clientId} onChange={(e) => setClientId(e.target.value)} required>
                    <option value="">Sélectionner un client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.full_name} {c.company ? `(${c.company})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Nom du projet *</label>
                  <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Mon Super Site" />
                </div>
                <div>
                  <label className="label">Domaine</label>
                  <input type="text" className="input" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="monsupersite.com" />
                </div>
                <div className="col-span-2">
                  <label className="label">Description</label>
                  <textarea className="input min-h-[80px] resize-y" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description du projet..." />
                </div>
                <div>
                  <label className="label">Stack technique</label>
                  <input type="text" className="input" value={techStack} onChange={(e) => setTechStack(e.target.value)} placeholder="Next.js, Tailwind, Supabase" />
                  <p className="text-xs text-slate-400 mt-1">Séparez par des virgules</p>
                </div>
                <div>
                  <label className="label">Statut</label>
                  <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="draft">Brouillon</option>
                    <option value="in_progress">En cours</option>
                    <option value="review">En revue</option>
                    <option value="deployed">Déployé</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Deployment */}
            <div>
              <h3 className="font-display font-semibold text-sm text-slate-900 mb-4">Déploiement & Hébergement</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Vercel Project ID</label>
                  <input type="text" className="input" value={vercelProjectId} onChange={(e) => setVercelProjectId(e.target.value)} placeholder="prj_..." />
                </div>
                <div>
                  <label className="label">Vercel Team ID</label>
                  <input type="text" className="input" value={vercelTeamId} onChange={(e) => setVercelTeamId(e.target.value)} placeholder="team_..." />
                </div>
                <div>
                  <label className="label">URL de production</label>
                  <input type="url" className="input" value={deployedUrl} onChange={(e) => setDeployedUrl(e.target.value)} placeholder="https://monsupersite.com" />
                </div>
                <div>
                  <label className="label">URL de staging</label>
                  <input type="url" className="input" value={stagingUrl} onChange={(e) => setStagingUrl(e.target.value)} placeholder="https://staging.monsupersite.com" />
                </div>
              </div>
            </div>

            {/* GitHub */}
            <div>
              <h3 className="font-display font-semibold text-sm text-slate-900 mb-4">GitHub</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Organisation GitHub</label>
                  <input type="text" className="input" value={githubOrg} onChange={(e) => setGithubOrg(e.target.value)} placeholder="mon-org" />
                </div>
                <div>
                  <label className="label">Repository</label>
                  <input type="text" className="input" value={githubRepo} onChange={(e) => setGithubRepo(e.target.value)} placeholder="mon-repo" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Link href="/admin/projects" className="btn-secondary">Annuler</Link>
              <button type="submit" disabled={submitting} className="btn-primary gap-1.5">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
                Créer le projet
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
