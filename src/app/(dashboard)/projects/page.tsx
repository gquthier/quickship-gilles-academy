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
import { useMobileMenu } from '../layout'

export default function ProjectsPage() {
  const onMenuToggle = useMobileMenu()
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
        <div className="w-8 h-8 border-[3px] border-surface-border border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <TopBar title="Mes projets" subtitle={`${projects.length} projet${projects.length !== 1 ? 's' : ''}`} onMenuToggle={onMenuToggle} />

      <div className="p-4 md:p-8">
        {projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="Aucun projet"
            description="Vous n'avez pas encore de projet. Votre gestionnaire de projet vous attribuera un acc&egrave;s."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="card hover:shadow-card-hover transition-shadow group">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <FolderKanban className="w-6 h-6 text-accent" />
                  </div>
                  <StatusBadge status={project.status} />
                </div>

                {/* Info */}
                <h3 className="font-display font-semibold text-text-primary mb-1">{project.name}</h3>
                {project.domain && (
                  <p className="text-sm text-text-secondary flex items-center gap-1 mb-3">
                    <Globe className="w-3.5 h-3.5" />
                    {project.domain}
                  </p>
                )}
                {project.description && (
                  <p className="text-sm text-text-muted line-clamp-2 mb-4">{project.description}</p>
                )}

                {/* Tech Stack */}
                {project.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.tech_stack.map((tech) => (
                      <span key={tech} className="text-xs bg-surface-hover text-text-secondary px-2 py-0.5 rounded-md">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center gap-4 pt-4 border-t border-surface-border text-xs text-text-muted">
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
