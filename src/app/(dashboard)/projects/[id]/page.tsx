'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { TopBar } from '@/components/layout/TopBar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate, formatDateTime } from '@/lib/utils'
import {
  Globe,
  ExternalLink,
  Github,
  Clock,
  Server,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'
import type { Project, VercelDeployment } from '@/types'

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null)
  const [deployments, setDeployments] = useState<VercelDeployment[]>([])
  const [loading, setLoading] = useState(true)
  const [deploymentsLoading, setDeploymentsLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('id', params.id)
        .single()

      if (data) {
        setProject(data as Project)
        if (data.vercel_project_id) {
          fetchDeployments(data.vercel_project_id, data.vercel_team_id)
        }
      }
      setLoading(false)
    }
    load()
  }, [params.id])

  async function fetchDeployments(projectId: string, teamId?: string | null) {
    setDeploymentsLoading(true)
    try {
      const res = await fetch(`/api/vercel?projectId=${projectId}${teamId ? `&teamId=${teamId}` : ''}`)
      const data = await res.json()
      setDeployments(data.deployments || [])
    } catch {
      // Vercel API not configured
    }
    setDeploymentsLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-slate-500">Projet introuvable</p>
      </div>
    )
  }

  function getDeploymentIcon(state: string) {
    switch (state) {
      case 'READY': return <CheckCircle2 className="w-5 h-5 text-accent-green" />
      case 'ERROR': return <XCircle className="w-5 h-5 text-accent-red" />
      case 'BUILDING': return <Loader2 className="w-5 h-5 text-accent-yellow animate-spin" />
      default: return <Clock className="w-5 h-5 text-slate-400" />
    }
  }

  return (
    <>
      <TopBar
        title={project.name}
        subtitle={project.domain || undefined}
        actions={
          <div className="flex items-center gap-2">
            {project.deployed_url && (
              <a href={project.deployed_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs gap-1.5">
                <ExternalLink className="w-4 h-4" /> Voir le site
              </a>
            )}
            {project.github_repo && (
              <a href={`https://github.com/${project.github_org || ''}/${project.github_repo}`} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs gap-1.5">
                <Github className="w-4 h-4" /> GitHub
              </a>
            )}
          </div>
        }
      />

      <div className="p-8">
        <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour aux projets
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Info Card */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-lg">Informations du projet</h2>
                <StatusBadge status={project.status} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Domaine</p>
                  <p className="text-sm font-medium">{project.domain || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Stack technique</p>
                  <div className="flex flex-wrap gap-1">
                    {project.tech_stack.length > 0 ? project.tech_stack.map((t) => (
                      <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{t}</span>
                    )) : <span className="text-sm text-slate-400">—</span>}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Créé le</p>
                  <p className="text-sm font-medium">{formatDate(project.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Dernière mise à jour</p>
                  <p className="text-sm font-medium">{formatDate(project.updated_at)}</p>
                </div>
              </div>
              {project.description && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Description</p>
                  <p className="text-sm text-slate-700">{project.description}</p>
                </div>
              )}
            </div>

            {/* Vercel Deployments */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-lg flex items-center gap-2">
                  <Server className="w-5 h-5 text-slate-400" />
                  Déploiements Vercel
                </h2>
                {project.vercel_project_id && (
                  <button
                    onClick={() => fetchDeployments(project.vercel_project_id!, project.vercel_team_id)}
                    className="text-xs text-purple hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Actualiser
                  </button>
                )}
              </div>

              {!project.vercel_project_id ? (
                <p className="text-sm text-slate-400 text-center py-8">Aucun projet Vercel lié</p>
              ) : deploymentsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-purple animate-spin" />
                </div>
              ) : deployments.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Aucun déploiement récent</p>
              ) : (
                <div className="space-y-3">
                  {deployments.slice(0, 10).map((d) => (
                    <a
                      key={d.uid}
                      href={`https://${d.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      {getDeploymentIcon(d.state)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {d.meta?.githubCommitMessage || d.url}
                        </p>
                        <p className="text-xs text-slate-400">
                          {d.meta?.githubCommitRef && `${d.meta.githubCommitRef} · `}
                          {formatDateTime(new Date(d.created))}
                        </p>
                      </div>
                      <span className={`text-xs font-medium ${d.state === 'READY' ? 'text-accent-green' : d.state === 'ERROR' ? 'text-accent-red' : 'text-accent-yellow'}`}>
                        {d.state}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Links */}
            <div className="card">
              <h3 className="font-display font-semibold mb-4">Liens rapides</h3>
              <div className="space-y-2">
                {project.deployed_url && (
                  <a href={project.deployed_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-sm">
                    <Globe className="w-5 h-5 text-accent-green" />
                    <span>Site en production</span>
                    <ExternalLink className="w-4 h-4 text-slate-300 ml-auto" />
                  </a>
                )}
                {project.staging_url && (
                  <a href={project.staging_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-sm">
                    <Globe className="w-5 h-5 text-accent-yellow" />
                    <span>Site de staging</span>
                    <ExternalLink className="w-4 h-4 text-slate-300 ml-auto" />
                  </a>
                )}
                {project.github_repo && (
                  <a href={`https://github.com/${project.github_org || ''}/${project.github_repo}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-sm">
                    <Github className="w-5 h-5 text-slate-700" />
                    <span>Repository GitHub</span>
                    <ExternalLink className="w-4 h-4 text-slate-300 ml-auto" />
                  </a>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="font-display font-semibold mb-4">Actions rapides</h3>
              <div className="space-y-2">
                <Link href={`/updates/new?project=${project.id}`} className="btn-primary w-full justify-center text-xs">
                  <RefreshCw className="w-4 h-4 mr-2" /> Demander une modification
                </Link>
                <Link href={`/support/new?project=${project.id}`} className="btn-secondary w-full justify-center text-xs">
                  Contacter le support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
