'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { TopBar } from '@/components/layout/TopBar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { formatDateTime, getPriorityColor } from '@/lib/utils'
import {
  ArrowLeft,
  Send,
  Loader2,
  Lock,
  Unlock,
  AlertCircle,
  User,
  Shield,
} from 'lucide-react'
import Link from 'next/link'
import { useAdminMobileMenu } from '@/context/admin-mobile-menu'
import type { SupportTicket, TicketMessage, Profile } from '@/types'

export default function SupportTicketDetailPage({ params }: { params: { id: string } }) {
  const [ticket, setTicket] = useState<SupportTicket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [sending, setSending] = useState(false)
  const [adminId, setAdminId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const onMenuToggle = useAdminMobileMenu()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) setAdminId(session.user.id)

      const [
        { data: ticketData },
        { data: messagesData },
      ] = await Promise.all([
        supabase
          .from('support_tickets')
          .select('*, client:profiles!support_tickets_client_id_fkey(full_name, email, avatar_url, company), project:projects(name), assignee:profiles!support_tickets_assigned_to_fkey(full_name)')
          .eq('id', params.id)
          .single(),
        supabase
          .from('ticket_messages')
          .select('*, sender:profiles(full_name, avatar_url, role)')
          .eq('ticket_id', params.id)
          .order('created_at', { ascending: true }),
      ])

      if (ticketData) setTicket(ticketData as SupportTicket)
      setMessages(messagesData || [])
      setLoading(false)
    }
    load()
  }, [params.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleStatusChange(newStatus: string) {
    if (!ticket) return
    await supabase.from('support_tickets').update({
      status: newStatus,
      ...(newStatus === 'resolved' ? { resolved_at: new Date().toISOString() } : {}),
    }).eq('id', ticket.id)
    setTicket({ ...ticket, status: newStatus as any })
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!reply.trim() || !ticket || !adminId) return
    setSending(true)

    const { data: msg } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticket.id,
        sender_id: adminId,
        message: reply.trim(),
        is_internal: isInternal,
        attachments: [],
      })
      .select('*, sender:profiles(full_name, avatar_url, role)')
      .single()

    if (msg) {
      setMessages(prev => [...prev, msg as TicketMessage])
      // Auto-set status to in_progress if was open
      if (ticket.status === 'open') {
        await handleStatusChange('in_progress')
      }
    }

    setReply('')
    setSending(false)
  }

  if (loading || !ticket) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-[3px] border-surface-border border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  const client = ticket.client as any
  const project = ticket.project as any

  return (
    <>
      <TopBar
        title={ticket.subject}
        subtitle={`Ticket #${ticket.id.slice(0, 8).toUpperCase()}`}
        onMenuToggle={onMenuToggle}
      />

      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        {/* Back */}
        <Link
          href="/admin/support"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux tickets
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main: Messages */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Messages list */}
            <div className="card p-0 overflow-hidden">
              <div className="p-4 border-b border-surface-border flex items-center justify-between">
                <h2 className="font-display font-bold text-sm">Conversation</h2>
                <span className="text-xs text-text-muted">{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="divide-y divide-surface-border max-h-[500px] overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="p-8 text-center text-text-muted text-sm">
                    Aucun message pour ce ticket.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const sender = msg.sender as any
                    const isAdmin = sender?.role === 'admin'
                    return (
                      <div
                        key={msg.id}
                        className={`p-4 ${msg.is_internal ? 'bg-amber-500/5 border-l-2 border-amber-500/40' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative flex-shrink-0">
                            <Avatar
                              name={sender?.full_name || '?'}
                              src={sender?.avatar_url}
                              size="sm"
                            />
                            {isAdmin && (
                              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                                <Shield className="w-2.5 h-2.5 text-black" />
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[13px] font-semibold text-text-primary">
                                {sender?.full_name || 'Inconnu'}
                              </span>
                              {isAdmin && (
                                <span className="text-[10px] font-mono bg-accent/10 text-accent px-1.5 py-0.5 rounded">ADMIN</span>
                              )}
                              {msg.is_internal && (
                                <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5" /> Interne
                                </span>
                              )}
                              <span className="text-[11px] text-text-muted ml-auto flex-shrink-0">
                                {formatDateTime(msg.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                              {msg.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Reply form */}
            {!['resolved', 'closed'].includes(ticket.status) && (
              <form onSubmit={handleSend} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-text-primary">Répondre</h3>
                  <button
                    type="button"
                    onClick={() => setIsInternal(!isInternal)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                      isInternal
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-surface text-text-muted border border-surface-border hover:bg-surface-hover'
                    }`}
                  >
                    {isInternal ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    {isInternal ? 'Note interne' : 'Réponse client'}
                  </button>
                </div>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder={isInternal ? 'Note interne (non visible par le client)...' : 'Répondre au client...'}
                  rows={4}
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/40 resize-none mb-3"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-text-muted">
                    {isInternal ? 'Note visible uniquement par les admins' : 'Le client recevra cette réponse'}
                  </p>
                  <button
                    type="submit"
                    disabled={!reply.trim() || sending}
                    className="btn-primary text-xs py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Envoyer
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {['resolved', 'closed'].includes(ticket.status) && (
              <div className="card p-4 text-center text-sm text-text-muted border-surface-border">
                Ce ticket est {ticket.status === 'resolved' ? 'résolu' : 'fermé'}. Changer le statut pour répondre.
              </div>
            )}
          </div>

          {/* Sidebar: Info */}
          <div className="space-y-4">
            {/* Status control */}
            <div className="card p-4">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Statut</h3>
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full bg-surface border border-surface-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-accent/30"
              >
                <option value="open">Ouvert</option>
                <option value="in_progress">En cours</option>
                <option value="waiting_client">Attente client</option>
                <option value="waiting_team">Attente équipe</option>
                <option value="resolved">Résolu</option>
                <option value="closed">Fermé</option>
              </select>
              <div className="mt-3 flex items-center gap-2">
                <StatusBadge status={ticket.status} />
                <StatusBadge status={ticket.priority} />
              </div>
            </div>

            {/* Client info */}
            <div className="card p-4">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Client</h3>
              <div className="flex items-center gap-3">
                <Avatar name={client?.full_name || '?'} src={client?.avatar_url} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{client?.full_name || '—'}</p>
                  <p className="text-xs text-text-muted truncate">{client?.company || client?.email}</p>
                </div>
              </div>
              {client && (
                <Link
                  href={`/admin/clients/${ticket.client_id}`}
                  className="mt-3 flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
                >
                  <User className="w-3 h-3" /> Voir le profil
                </Link>
              )}
            </div>

            {/* Project info */}
            {project && (
              <div className="card p-4">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Projet</h3>
                <p className="text-sm font-medium text-text-primary">{project.name}</p>
                <Link
                  href={`/admin/projects/${ticket.project_id}`}
                  className="mt-2 flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
                >
                  Voir le projet →
                </Link>
              </div>
            )}

            {/* Metadata */}
            <div className="card p-4 space-y-3">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Détails</h3>
              <div>
                <p className="text-[11px] text-text-muted mb-0.5">Créé le</p>
                <p className="text-sm text-text-primary">{formatDateTime(ticket.created_at)}</p>
              </div>
              {ticket.resolved_at && (
                <div>
                  <p className="text-[11px] text-text-muted mb-0.5">Résolu le</p>
                  <p className="text-sm text-text-primary">{formatDateTime(ticket.resolved_at)}</p>
                </div>
              )}
              <div>
                <p className="text-[11px] text-text-muted mb-0.5">Priorité</p>
                <p className={`text-sm font-semibold ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority === 'urgent' ? '🔴' : ticket.priority === 'high' ? '🟠' : ticket.priority === 'medium' ? '🟡' : '⚪'} {
                    { low: 'Basse', medium: 'Moyenne', high: 'Haute', urgent: 'Urgente' }[ticket.priority]
                  }
                </p>
              </div>
              {ticket.category && (
                <div>
                  <p className="text-[11px] text-text-muted mb-0.5">Catégorie</p>
                  <p className="text-sm text-text-primary">{ticket.category}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
