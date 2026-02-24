'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { TopBar } from '@/components/layout/TopBar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { formatDateTime } from '@/lib/utils'
import { ArrowLeft, Send, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { SupportTicket, TicketMessage, Profile } from '@/types'

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const [ticket, setTicket] = useState<SupportTicket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setCurrentUser(profile as Profile)

      const { data: ticketData } = await supabase
        .from('support_tickets')
        .select('*, project:projects(name)')
        .eq('id', params.id)
        .single()

      setTicket(ticketData as any)

      const { data: messagesData } = await supabase
        .from('ticket_messages')
        .select('*, sender:profiles(full_name, avatar_url, role)')
        .eq('ticket_id', params.id)
        .order('created_at', { ascending: true })

      setMessages(messagesData || [])
    }
    load()

    // Realtime subscription
    const channel = supabase
      .channel(`ticket-${params.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ticket_messages',
        filter: `ticket_id=eq.${params.id}`,
      }, async (payload) => {
        const { data } = await supabase
          .from('ticket_messages')
          .select('*, sender:profiles(full_name, avatar_url, role)')
          .eq('id', payload.new.id)
          .single()
        if (data) {
          setMessages(prev => [...prev, data as any])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [params.id])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !currentUser) return

    setSending(true)
    await supabase.from('ticket_messages').insert({
      ticket_id: params.id,
      sender_id: currentUser.id,
      message: newMessage.trim(),
    })
    setNewMessage('')
    setSending(false)
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-[3px] border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <TopBar title={ticket.subject} />

      <div className="p-8 max-w-3xl">
        <Link href="/support" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour au support
        </Link>

        {/* Ticket Info */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <StatusBadge status={ticket.status} />
              <StatusBadge status={ticket.priority} />
              {(ticket as any).project?.name && (
                <span className="text-xs text-gray-400">{(ticket as any).project.name}</span>
              )}
            </div>
            <span className="text-xs text-gray-400">{formatDateTime(ticket.created_at)}</span>
          </div>
          <p className="text-sm text-gray-700">{ticket.description}</p>
        </div>

        {/* Messages */}
        <div className="space-y-4 mb-6">
          {messages.map((msg) => {
            const sender = msg.sender as any
            const isOwn = msg.sender_id === currentUser?.id
            return (
              <div key={msg.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                <Avatar name={sender?.full_name || 'U'} src={sender?.avatar_url} size="sm" />
                <div className={`max-w-[70%] ${isOwn ? 'text-right' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-700">{sender?.full_name || 'Utilisateur'}</span>
                    {sender?.role === 'admin' && (
                      <span className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">Équipe</span>
                    )}
                    <span className="text-xs text-gray-400">{formatDateTime(msg.created_at)}</span>
                  </div>
                  <div className={`p-3 rounded-xl text-sm ${
                    isOwn
                      ? 'bg-purple-600 text-white rounded-tr-sm'
                      : 'bg-white border border-gray-200 text-gray-700 rounded-tl-sm'
                  }`}>
                    {msg.message}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Reply Box */}
        {!['resolved', 'closed'].includes(ticket.status) && (
          <form onSubmit={handleSend} className="card">
            <textarea
              className="input min-h-[80px] resize-y mb-3"
              placeholder="Votre message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              required
            />
            <div className="flex justify-end">
              <button type="submit" disabled={sending} className="btn-primary gap-1.5 text-xs">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Envoyer
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}
