'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { TopBar } from '@/components/layout/TopBar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, getStatusLabel } from '@/lib/utils'
import { LifeBuoy, Plus, MessageSquare, Clock } from 'lucide-react'
import Link from 'next/link'
import type { SupportTicket } from '@/types'

export default function SupportPage() {
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
        actions={
          <Link href="/support/new" className="btn-primary text-xs gap-1.5">
            <Plus className="w-4 h-4" /> Nouveau ticket
          </Link>
        }
      />

      <div className="p-8">
        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          {['all', 'open', 'closed'].map((f) => (
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
                {f === 'all' ? tickets.length : f === 'open' ? tickets.filter(t => !['resolved', 'closed'].includes(t.status)).length : tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length}
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
          <div className="card divide-y divide-surface-border">
            {filteredTickets.map((ticket) => (
              <Link key={ticket.id} href={`/support/${ticket.id}`} className="flex items-center gap-4 p-4 hover:bg-surface-hover transition-colors first:rounded-t-2xl last:rounded-b-2xl">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-medium text-text-primary truncate">{ticket.subject}</h3>
                    <StatusBadge status={ticket.priority} />
                  </div>
                  <p className="text-xs text-text-muted flex items-center gap-2">
                    {(ticket as any).project?.name && <span>{(ticket as any).project.name}</span>}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDate(ticket.created_at)}
                    </span>
                  </p>
                </div>
                <StatusBadge status={ticket.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
