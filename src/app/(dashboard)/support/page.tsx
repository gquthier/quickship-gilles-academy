'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { TopBar } from '@/components/layout/TopBar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, getPriorityColor, getStatusLabel } from '@/lib/utils'
import { LifeBuoy, Plus, MessageSquare, Clock, Tag, FolderKanban, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import type { SupportTicket } from '@/types'
import { useMobileMenu } from '../layout'

const priorityDot: Record<string, string> = {
  low: 'bg-text-muted',
  medium: 'bg-amber-400',
  high: 'bg-orange-400',
  urgent: 'bg-red-400',
}

export default function SupportPage() {
  const onMenuToggle = useMobileMenu()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data } = await supabase
        .from('support_tickets')
        .select('*, project:projects(name)')
        .eq('client_id', session.user.id)
        .order('created_at', { ascending: false })

      setTickets(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filteredTickets = filter === 'all'
    ? tickets
    : filter === 'open'
      ? tickets.filter(t => !['resolved', 'closed'].includes(t.status))
      : tickets.filter(t => ['resolved', 'closed'].includes(t.status))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-[3px] border-surface-border border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <TopBar
        title="Support"
        subtitle="Vos tickets de support"
        onMenuToggle={onMenuToggle}
        actions={
          <Link href="/support/new" className="btn-primary text-xs gap-1.5">
            <Plus className="w-4 h-4" /> Nouveau ticket
          </Link>
        }
      />

      <div className="p-4 md:p-8">
        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          {(['all', 'open', 'closed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-accent text-black'
                  : 'bg-surface/60 text-text-secondary border border-surface-border hover:bg-surface-hover'
              }`}
            >
              {f === 'all' ? 'Tous' : f === 'open' ? 'Ouverts' : 'Ferm\u00e9s'}
              <span className="ml-1.5 text-xs opacity-70">
                {f === 'all'
                  ? tickets.length
                  : f === 'open'
                  ? tickets.filter(t => !['resolved', 'closed'].includes(t.status)).length
                  : tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length}
              </span>
            </button>
          ))}
        </div>

        {filteredTickets.length === 0 ? (
          <EmptyState
            icon={LifeBuoy}
            title="Aucun ticket"
            description="Vous n'avez pas encore de tickets de support."
            action={
              <Link href="/support/new" className="btn-primary text-xs gap-1.5">
                <Plus className="w-4 h-4" /> Cr&eacute;er un ticket
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => {
              const projectName = (ticket as SupportTicket & { project?: { name: string } }).project?.name
              return (
                <Link
                  key={ticket.id}
                  href={`/support/${ticket.id}`}
                  className="card hover:border-text-muted hover:shadow-card-hover transition-all duration-200 block"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MessageSquare className="w-5 h-5 text-accent" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-sm font-semibold text-text-primary leading-snug">{ticket.subject}</h3>
                        <StatusBadge status={ticket.status} />
                      </div>

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                        {/* Priority */}
                        <span className={`flex items-center gap-1.5 text-xs ${getPriorityColor(ticket.priority)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${priorityDot[ticket.priority] ?? 'bg-text-muted'}`} />
                          <AlertTriangle className="w-3 h-3" />
                          {getStatusLabel(ticket.priority)}
                        </span>

                        {/* Category */}
                        {ticket.category && (
                          <span className="flex items-center gap-1 text-xs text-text-muted">
                            <Tag className="w-3 h-3" />
                            {ticket.category}
                          </span>
                        )}

                        {/* Project */}
                        {projectName && (
                          <span className="flex items-center gap-1 text-xs text-text-muted">
                            <FolderKanban className="w-3 h-3" />
                            {projectName}
                          </span>
                        )}

                        {/* Date */}
                        <span className="flex items-center gap-1 text-xs text-text-muted ml-auto">
                          <Clock className="w-3 h-3" />
                          {formatDate(ticket.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
