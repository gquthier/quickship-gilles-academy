'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { TopBar } from '@/components/layout/TopBar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { formatDate, formatDateTime } from '@/lib/utils'
import {
  ArrowLeft,
  Globe,
  ExternalLink,
  Github,
  Server,
  RefreshCw,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  LifeBuoy,
  Edit3,
} from 'lucide-react'
import Link from 'next/link'
import type { Project, SupportTicket, UpdateRequest, VercelDeployment } from '@/types'

export default function AdminProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [updates, setUpdates] = useState<UpdateRequest[]>([])
  const [deployments, setDeployments] = useState<VercelDeployment[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editData, setEditData] = useState<Partial<Project>>({})
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [
        { data: projectData },
        { data: ticketsData },
        { data: updatesData },
      ] = await Promise.all([
        supabase.from('projects').select('*, client:profiles(full_name, company, email)').eq('id', params.id).single(),
        supabase.from('support_tickets').select('*').eq('project_id', params.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('update_requests').select('*').eq('project_id', params.id).order('created_at', { ascending: false }).limit(10),
      ])

      if (projectData) {
        setProject(projectData as any)
        setEditData(projectData as any)
        if (projectData.vercel_project_id) {
          fetchDeployments(projectData.vercel_project_id, projectData.vercel_team_id)
        }
      }
      setTickets(ticketsData || [])
      setUpdates(updatesData || [])
      setLoading(false)
    }
    load()
  }, [params.id])

  async function fetchDeployments(projectId: string, teamId?: string | null) {
    try {
      const res = await fetch(`/api/vercel?projectId=${projectId}${teamId ? `&teamId=${teamId}` : ''}`)
      const data = await res.json()
      setDeployments(data.deployments || [])
    } catch {}
  }

  async function handleSave() {
    setSaving(true)
    const { status, domain, vercel_project_id, vercel_team_id, github_repo, github_org, deployed_url, staging_url, notes } = editData as Project
    await supabase.from('projects').update({
      status, domain, vercel_project_id, vercel_team_id, github_repo, github_org, deployed_url, staging_url, notes,
    }).eq('id', params.id)

    setProject({ ...project!, ...editData } as Project)
    setEditing(false)
    setSaving(false)
  }

  async function handleUpdateRequestStatus(requestId: string, newStatus: string) {
    await supabase.from('update_requests').update({ status: newStatus }).eq('id', requestId)
    setUpdates(prev => prev.map(u => u.id === requestId ? { ...u, status: newStatus as any } : u))
  }

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const client = project.client as any

  return (
    <>
      <TopBar
        title={project.name}
        subtitle={project.domain || client?.full_name}
        actions={
          <div className="flex gap-2">
            {!editing ? (
              <button onClick={() => setEditing(true)} className="btn-secondary text-xs gap-1.5">
                <Edit3 className="w-4 h-4" /> Modifier
              </button>
            ) : (
              <>
                <button onClick={() => setEditing(false)} className="btn-secondary text-xs">Annuler</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary text-xs gap-1.5">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Sauvegarder
                </button>
              </>
            )}
          </div>
        }
      />

      <div className="p-8">
        <Link href="/admin/projects" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour aux projets
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Project Info */}
            <div className="card">
              <h3 className="font-display font-bold mb-4">Informations</h3>
              {editing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Statut</label>
                    <select className="input" value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value as any })}>
                      {['draft', 'in_progress', 'review', 'deployed', 'maintenance', 'paused', 'archived'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Domaine</label>
                    <input type="text" className="input" value={editData.domain || ''} onChange={(e) => setEditData({ ...editData, domain: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">URL production</label>
                    <input type="url" className="input" value={editData.deployed_url || ''} onChange={(e) => setEditData({ ...editData, deployed_url: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">URL staging</label>
                    <input type="url" className="input" value={editData.staging_url || ''} onChange={(e) => setEditData({ ...editData, staging_url: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Vercel Project ID</label>
                    <input type="text" className="input" value={editData.vercel_project_id || ''} onChange={(e) => setEditData({ ...editData, vercel_project_id: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">GitHub Repo</label>
                    <input type="text" className="input" value={editData.github_repo || ''} onChange={(e) => setEditData({ ...editData, github_repo: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Notes internes</label>
                    <textarea className="input min-h-[80px] resize-y" value={editData.notes || ''} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-slate-400 text-xs block mb-0.5">Statut</span><StatusBadge status={project.status} /></div>
                  <div><span className="text-slate-400 text-xs block mb-0.5">Domaine</span>{project.domain || '—'}</div>
                  <div><span className="text-slate-400 text-xs block mb-0.5">Production</span>{project.deployed_url ? <a href={project.deployed_url} className="text-purple hover:underline" target="_blank">{project.deployed_url}</a> : '—'}</div>
                  <div><span className="text-slate-400 text-xs block mb-0.5">Staging</span>{project.staging_url || '—'}</div>
                  <div><span className="text-slate-400 text-xs block mb-0.5">Vercel</span>{project.vercel_project_id || '—'}</div>
                  <div><span className="text-slate-400 text-xs block mb-0.5">GitHub</span>{project.github_repo ? <a href={`https://github.com/${project.github_org || ''}/${project.github_repo}`} className="text-purple hover:underline" target="_blank">{project.github_org}/{project.github_repo}</a> : '—'}</div>
                  {project.notes && <div className="col-span-2"><span className="text-slate-400 text-xs block mb-0.5">Notes</span>{project.notes}</div>}
                </div>
              )}
            </div>

            {/* Deployments */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold flex items-center gap-2">
                  <Server className="w-5 h-5 text-slate-400" /> Déploiements
                </h3>
                {project.vercel_project_id && (
                  <button onClick={() => fetchDeployments(project.vercel_project_id!, project.vercel_team_id)} className="text-xs text-purple hover:underline flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5" /> Actualiser
                  </button>
                )}
              </div>
              {deployments.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">Aucun déploiement</p>
              ) : (
                <div className="space-y-2">
                  {deployments.slice(0, 8).map((d) => (
                    <a key={d.uid} href={`https://${d.url}`} target="_blank" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      {d.state === 'READY' ? <CheckCircle2 className="w-4 h-4 text-accent-green" /> : d.state === 'ERROR' ? <XCircle className="w-4 h-4 text-accent-red" /> : <Clock className="w-4 h-4 text-accent-yellow" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{d.meta?.githubCommitMessage || d.url}</p>
                        <p className="text-xs text-slate-400">{formatDateTime(new Date(d.created))}</p>
                      </div>
                      <span className="text-xs font-medium">{d.state}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Update Requests */}
            <div className="card">
              <h3 className="font-display font-bold flex items-center gap-2 mb-4">
                <RefreshCw className="w-5 h-5 text-teal" /> Demandes de modification ({updates.length})
              </h3>
              {updates.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Aucune demande</p>
              ) : (
                <div className="space-y-3">
                  {updates.map((u) => (
                    <div key={u.id} className="p-3 rounded-xl border border-slate-100">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium">{u.title}</p>
                          <p className="text-xs text-slate-400">{formatDate(u.created_at)}</p>
                        </div>
                        <StatusBadge status={u.status} />
                      </div>
                      <p className="text-xs text-slate-600 mb-2">{u.description}</p>
                      {u.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateRequestStatus(u.id, 'accepted')} className="text-xs text-accent-green hover:underline">Accepter</button>
                          <button onClick={() => handleUpdateRequestStatus(u.id, 'rejected')} className="text-xs text-accent-red hover:underline">Refuser</button>
                        </div>
                      )}
                      {u.status === 'accepted' && (
                        <button onClick={() => handleUpdateRequestStatus(u.id, 'in_progress')} className="text-xs text-purple hover:underline">Passer en cours</button>
                      )}
                      {u.status === 'in_progress' && (
                        <button onClick={() => handleUpdateRequestStatus(u.id, 'completed')} className="text-xs text-accent-green hover:underline">Marquer terminé</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client */}
            <div className="card">
              <h3 className="font-display font-semibold mb-3">Client</h3>
              {client && (
                <Link href={`/admin/clients/${project.client_id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <Avatar name={client.full_name} size="md" />
                  <div>
                    <p className="text-sm font-medium">{client.full_name}</p>
                    <p className="text-xs text-slate-400">{client.company || client.email}</p>
                  </div>
                </Link>
              )}
            </div>

            {/* Quick Links */}
            <div className="card">
              <h3 className="font-display font-semibold mb-3">Liens</h3>
              <div className="space-y-2">
                {project.deployed_url && (
                  <a href={project.deployed_url} target="_blank" className="flex items-center gap-2 text-sm text-slate-600 hover:text-purple p-2 rounded-lg hover:bg-slate-50">
                    <Globe className="w-4 h-4" /> Production <ExternalLink className="w-3 h-3 ml-auto text-slate-300" />
                  </a>
                )}
                {project.github_repo && (
                  <a href={`https://github.com/${project.github_org || ''}/${project.github_repo}`} target="_blank" className="flex items-center gap-2 text-sm text-slate-600 hover:text-purple p-2 rounded-lg hover:bg-slate-50">
                    <Github className="w-4 h-4" /> GitHub <ExternalLink className="w-3 h-3 ml-auto text-slate-300" />
                  </a>
                )}
              </div>
            </div>

            {/* Recent Tickets */}
            <div className="card">
              <h3 className="font-display font-semibold flex items-center gap-2 mb-3">
                <LifeBuoy className="w-4 h-4 text-coral" /> Tickets ({tickets.length})
              </h3>
              {tickets.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center gap-2 py-2 text-sm">
                  <span className="flex-1 truncate">{t.subject}</span>
                  <StatusBadge status={t.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
