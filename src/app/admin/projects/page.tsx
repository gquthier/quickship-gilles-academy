'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { TopBar } from '@/components/layout/TopBar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import { FolderKanban, Plus, Globe, Github, Clock } from 'lucide-react'
import Link from 'next/link'
import type { Project } from '@/types'

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('projects')
        .select('*, client:profiles(full_name, company)')
        .order('created_at', { ascending: false })

      setProjects(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const statuses = ['all', 'draft', 'in_progress', 'review', 'deployed', 'maintenance', 'paused', 'archived']

  const filtered = projects
    .filter(p => statusFilter === 'all' || p.status === statusFilter)
    .filter(p =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.domain || '').toLowerCase().includes(search.toLowerCase()) ||
      ((p.client as any)?.full_name || '').toLowerCase().includes(search.toLowerCase())
    )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <TopBar
        title="Projets"
        subtitle={`${projects.length} projet${projects.length !== 1 ? 's' : ''} au total`}
        actions={
          <Link href="/admin/projects/new" className="btn-primary text-xs gap-1.5">
            <Plus className="w-4 h-4" /> Nouveau projet
          </Link>
        }
      />

      <div className="p-8">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <input
            type="text"
            className="input max-w-xs"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-1.5 flex-wrap">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-purple text-white'
                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {s === 'all' ? 'Tous' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="Aucun projet"
            description={search || statusFilter !== 'all' ? "Aucun résultat." : "Aucun projet pour l'instant."}
          />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-500 p-4">Projet</th>
                  <th className="text-left text-xs font-semibold text-slate-500 p-4">Client</th>
                  <th className="text-left text-xs font-semibold text-slate-500 p-4">Domaine</th>
                  <th className="text-left text-xs font-semibold text-slate-500 p-4">Statut</th>
                  <th className="text-left text-xs font-semibold text-slate-500 p-4">Liens</th>
                  <th className="text-left text-xs font-semibold text-slate-500 p-4">Mis à jour</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <Link href={`/admin/projects/${project.id}`} className="text-sm font-medium text-slate-900 hover:text-purple">
                        {project.name}
                      </Link>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-600">{(project.client as any)?.full_name || '—'}</p>
                      <p className="text-xs text-slate-400">{(project.client as any)?.company || ''}</p>
                    </td>
                    <td className="p-4">
                      {project.domain ? (
                        <span className="text-sm text-slate-600 flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5" /> {project.domain}
                        </span>
                      ) : <span className="text-sm text-slate-300">—</span>}
                    </td>
                    <td className="p-4"><StatusBadge status={project.status} /></td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {project.deployed_url && (
                          <a href={project.deployed_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-purple">
                            <Globe className="w-4 h-4" />
                          </a>
                        )}
                        {project.github_repo && (
                          <a href={`https://github.com/${project.github_org || ''}/${project.github_repo}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-purple">
                            <Github className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDate(project.updated_at)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
