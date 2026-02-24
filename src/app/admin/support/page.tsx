'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { TopBar } from '@/components/layout/TopBar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { formatDateTime } from '@/lib/utils'
import { LifeBuoy, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import type { SupportTicket } from '@/types'

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [filter, setFilter] = useState('open')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('support_tickets')
        .select('*, client:profiles(full_name, avatar_url, company), project:projects(name), assignee:profiles!support_tickets_assigned_to_fkey(full_name)')
        .order('created_at', { ascending: false })

      setTickets(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filter === 'all'
    ? tickets
    : filter === 'open'
      ? tickets.filter(t => !['resolved', 'closed'].includes(t.status))
      : tickets.filter(t => ['resolved', 'closed'].includes(t.status))

  async function handleStatusChange(ticketId: string, newStatus: string) {
    await supabase.from('support_tickets').update({
      status: newStatus,
      ...(newStatus === 'resolved' ? { resolved_at: new Date().toISOString() } : {}),
    }).eq('id', ticketId)
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus as any } : t))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-[3px] border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <TopBar title="Support" subtitle={`${tickets.filter(t => !['resolved', 'closed'].includes(t.status)).length} tickets ouverts`} />

      <div className="p-8">
        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          {['all', 'open', 'closed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === f ? 'bg-purple-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? 'Tous' : f === 'open' ? 'Ouverts' : 'Fermés'}
            </button>
          ))}
        </div>

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 p-4">Ticket</th>
                <th className="text-left text-xs font-semibold text-gray-500 p-4">Client</th>
                <th className="text-left text-xs font-semibold text-gray-500 p-4">Projet</th>
                <th className="text-left text-xs font-semibold text-gray-500 p-4">Priorité</th>
                <th className="text-left text-xs font-semibold text-gray-500 p-4">Statut</th>
                <th className="text-left text-xs font-semibold text-gray-500 p-4">Date</th>
                <th className="text-left text-xs font-semibold text-gray-500 p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <p className="text-sm font-medium text-gray-900">{ticket.subject}</p>
                    <p className="text-xs text-gray-400 truncate max-w-xs">{ticket.description}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Avatar name={(ticket.client as any)?.full_name || 'C'} src={(ticket.client as any)?.avatar_url} size="sm" />
                      <div>
                        <p className="text-sm">{(ticket.client as any)?.full_name}</p>
                        <p className="text-xs text-gray-400">{(ticket.client as any)?.company}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{(ticket as any).project?.name || '—'}</td>
                  <td className="p-4"><StatusBadge status={ticket.priority} /></td>
                  <td className="p-4"><StatusBadge status={ticket.status} /></td>
                  <td className="p-4 text-xs text-gray-400">{formatDateTime(ticket.created_at)}</td>
                  <td className="p-4">
                    <select
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1"
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                    >
                      <option value="open">Ouvert</option>
                      <option value="in_progress">En cours</option>
                      <option value="waiting_client">Attente client</option>
                      <option value="waiting_team">Attente équipe</option>
                      <option value="resolved">Résolu</option>
                      <option value="closed">Fermé</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
