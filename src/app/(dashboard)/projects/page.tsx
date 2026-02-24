'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { TopBar } from '@/components/layout/TopBar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import { FolderKanban, Globe, ExternalLink, Github, Clock } from 'lucide-react'
import Link from 'next/link'
import type { Project } from '@/types'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', session.user.id)
        .order('created_at', { ascending: false })

      setProjects(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <TopBar title="Mes projets" subtitle={`${projects.length} projet${projects.length !== 1 ? 's' : ''}`} />

      <div className="p-8">
        {projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="Aucun projet"
            description="Vous n'avez pas encore de projet. Votre gestionnaire de projet vous attribuera un accès."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="card hover:shadow-md transition-shadow group">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                    <FolderKanban className="w-6 h-6 text-purple" />
                  </div>
                  <StatusBadge status={project.status} />
                </div>

                {/* Info */}
                <h3 className="font-display font-semibold text-slate-900 mb-1">{project.name}</h3>
                {project.domain && (
                  <p className="text-sm text-slate-500 flex items-center gap-1 mb-3">
                    <Globe className="w-3.5 h-3.5" />
                    {project.domain}
                  </p>
                )}
                {project.description && (
                  <p className="text-sm text-slate-400 line-clamp-2 mb-4">{project.description}</p>
                )}

                {/* Tech Stack */}
                {project.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.tech_stack.map((tech) => (
                      <span key={tech} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center gap-4 pt-4 border-t border-slate-100 text-xs text-slate-400">
                  {project.deployed_url && (
                    <span className="flex items-center gap-1">
                      <ExternalLink className="w-3.5 h-3.5" /> En ligne
                    </span>
                  )}
                  {project.github_repo && (
                    <span className="flex items-center gap-1">
                      <Github className="w-3.5 h-3.5" /> GitHub
                    </span>
                  )}
                  <span className="flex items-center gap-1 ml-auto">
                    <Clock className="w-3.5 h-3.5" /> {formatDate(project.updated_at)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
