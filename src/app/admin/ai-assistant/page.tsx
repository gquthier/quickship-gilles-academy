'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { TopBar } from '@/components/layout/TopBar'
import { useAdminMobileMenu } from '@/context/admin-mobile-menu'
import {
  Sparkles, Send, Copy, RefreshCw, User,
  Bot, Loader2, FileText, MessageSquare,
  TrendingUp, Mail, Lightbulb, ChevronRight,
  Trash2, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface KPIContext {
  totalClients: number
  activeProjects: number
  openTickets: number
  revenueMonthly: number
}

const QUICK_PROMPTS = [
  {
    icon: FileText,
    label: 'Proposer commercial',
    prompt: 'Génère une proposition commerciale professionnelle pour un client e-commerce qui souhaite créer une boutique en ligne avec Next.js. Budget estimé 3-5k€, délai 3 semaines.',
  },
  {
    icon: MessageSquare,
    label: 'Réponse support',
    prompt: 'Un client est frustré parce que son site est en maintenance depuis 2 jours. Rédige une réponse empathique, professionnelle et rassurante pour son ticket de support.',
  },
  {
    icon: TrendingUp,
    label: 'Analyser KPIs',
    prompt: 'Analyse les KPIs actuels de QuickShip et propose 3 actions concrètes pour améliorer la rétention client et augmenter le chiffre d\'affaires mensuel.',
  },
  {
    icon: Mail,
    label: 'Email de suivi',
    prompt: 'Rédige un email de suivi professionnel pour relancer un prospect qui a demandé un devis il y a 1 semaine et n\'a pas répondu.',
  },
  {
    icon: Lightbulb,
    label: 'Améliorer projet',
    prompt: 'Un client a un site vitrine Next.js. Propose 5 améliorations concrètes pour augmenter ses conversions et son référencement SEO.',
  },
]

function MessageBubble({ message, onCopy }: { message: Message; onCopy: (text: string) => void }) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  function handleCopy() {
    onCopy(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('group flex gap-3 mb-6', isUser ? 'flex-row-reverse' : '')}>
      {/* Avatar */}
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5',
        isUser
          ? 'bg-accent text-bg'
          : 'bg-surface-border text-accent border border-surface-light'
      )}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Bubble */}
      <div className={cn('flex-1 max-w-[80%]', isUser ? 'items-end' : 'items-start', 'flex flex-col gap-1')}>
        <div className={cn(
          'px-4 py-3 rounded-xl text-[13px] leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'bg-accent text-bg font-medium rounded-tr-sm'
            : 'bg-surface border border-surface-border text-text-primary rounded-tl-sm'
        )}>
          {message.content}
        </div>

        {/* Actions */}
        <div className={cn(
          'flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity',
          isUser ? 'flex-row-reverse' : ''
        )}>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-secondary transition-colors px-2 py-1 rounded"
          >
            {copied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
          <span className="text-[10px] text-text-muted">
            {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-6">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface-border border border-surface-light flex items-center justify-center">
        <Bot className="w-4 h-4 text-accent" />
      </div>
      <div className="bg-surface border border-surface-border rounded-xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

export default function AIAssistantPage() {
  const onMenuToggle = useAdminMobileMenu()
  const supabase = createClient()

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Bonjour ! Je suis votre assistant IA QuickShip. Je peux vous aider à générer des propositions commerciales, rédiger des réponses aux clients, analyser vos KPIs ou proposer des améliorations pour vos projets.\n\nComment puis-je vous aider aujourd\'hui ?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [kpi, setKpi] = useState<KPIContext | null>(null)
  const [copied, setCopied] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadKPIs()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function loadKPIs() {
    const [clientsRes, projectsRes, ticketsRes] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
      supabase.from('projects').select('*', { count: 'exact', head: true }).in('status', ['in_progress', 'review', 'deployed']),
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
    ])
    setKpi({
      totalClients: clientsRes.count || 0,
      activeProjects: projectsRes.count || 0,
      openTickets: ticketsRes.count || 0,
      revenueMonthly: 0,
    })
  }

  function buildContext(): string {
    if (!kpi) return ''
    return `- Clients totaux : ${kpi.totalClients}
- Projets actifs : ${kpi.activeProjects}
- Tickets ouverts : ${kpi.openTickets}
- Date : ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
  }

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }

    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          context: buildContext(),
        }),
      })

      const data = await res.json()

      if (data.reply) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
          timestamp: new Date(),
        }])
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Désolé, une erreur s'est produite : ${data.error || 'Erreur inconnue'}`,
          timestamp: new Date(),
        }])
      }
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Erreur de connexion. Vérifiez votre connexion internet.',
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  function handleTextareaInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    // Auto-resize
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
  }

  function clearConversation() {
    setMessages([{
      id: '0',
      role: 'assistant',
      content: 'Conversation effacée. Comment puis-je vous aider ?',
      timestamp: new Date(),
    }])
  }

  function copyLastResponse() {
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant')
    if (lastAssistant) {
      navigator.clipboard.writeText(lastAssistant.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 0px)' }}>
      <TopBar
        title="Assistant IA"
        subtitle="Powered by Gemini 2.0 Flash"
        onMenuToggle={onMenuToggle}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={copyLastResponse}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-border text-text-secondary hover:text-text-primary hover:bg-surface-hover text-xs transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
            <button
              onClick={clearConversation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-border text-text-secondary hover:text-red-400 hover:border-red-400/30 text-xs transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Effacer
            </button>
          </div>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {messages.map(msg => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onCopy={(text) => navigator.clipboard.writeText(text)}
              />
            ))}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          {messages.length <= 1 && (
            <div className="px-4 md:px-6 pb-4">
              <p className="text-[11px] text-text-muted mb-3 uppercase tracking-wider font-medium">Démarrage rapide</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {QUICK_PROMPTS.map((qp) => (
                  <button
                    key={qp.label}
                    onClick={() => sendMessage(qp.prompt)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-surface-border bg-surface hover:border-accent/40 hover:bg-accent/5 text-left transition-all group"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface-light group-hover:bg-accent/10 flex items-center justify-center transition-colors">
                      <qp.icon className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-text-secondary group-hover:text-text-primary transition-colors">
                        {qp.label}
                      </p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-accent opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-surface-border p-4 md:p-5">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleTextareaInput}
                  onKeyDown={handleKeyDown}
                  placeholder="Écrivez votre message... (Entrée pour envoyer, Shift+Entrée pour sauter une ligne)"
                  rows={1}
                  className={cn(
                    'w-full resize-none bg-surface border border-surface-border rounded-xl px-4 py-3',
                    'text-[13px] text-text-primary placeholder:text-text-muted',
                    'focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20',
                    'transition-all overflow-hidden',
                    'min-h-[44px] max-h-[160px]'
                  )}
                  style={{ height: '44px' }}
                />
              </div>
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className={cn(
                  'flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all',
                  input.trim() && !loading
                    ? 'bg-accent text-bg hover:bg-accent-hover shadow-glow'
                    : 'bg-surface-border text-text-muted cursor-not-allowed'
                )}
              >
                {loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />
                }
              </button>
            </div>
            <p className="text-[10px] text-text-muted mt-2 text-center">
              L&apos;IA peut faire des erreurs. Vérifiez les informations importantes.
            </p>
          </div>
        </div>

        {/* Context sidebar */}
        <div className="hidden xl:flex w-[280px] border-l border-surface-border flex-col">
          <div className="p-5 border-b border-surface-border">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-accent" />
              <h3 className="text-[13px] font-semibold text-text-primary">Contexte injecté</h3>
            </div>
            <p className="text-[11px] text-text-muted">L&apos;IA reçoit ces données en temps réel</p>
          </div>

          {kpi ? (
            <div className="p-5 space-y-4">
              <KPIItem label="Clients totaux" value={kpi.totalClients.toString()} color="accent" />
              <KPIItem label="Projets actifs" value={kpi.activeProjects.toString()} color="blue" />
              <KPIItem label="Tickets ouverts" value={kpi.openTickets.toString()} color="red" />
              <KPIItem label="Date du jour" value={new Date().toLocaleDateString('fr-FR')} color="muted" />
            </div>
          ) : (
            <div className="p-5 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-text-muted animate-spin" />
            </div>
          )}

          <div className="p-5 border-t border-surface-border mt-auto">
            <p className="text-[10px] text-text-muted leading-relaxed">
              Modèle : <span className="text-text-secondary">Gemini 2.0 Flash</span><br />
              Contexte : <span className="text-text-secondary">KPIs + historique</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function KPIItem({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    accent: 'text-accent',
    blue: 'text-blue-400',
    red: 'text-red-400',
    muted: 'text-text-secondary',
  }
  return (
    <div className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
      <span className="text-[12px] text-text-muted">{label}</span>
      <span className={cn('text-[13px] font-bold font-mono', colorMap[color] || 'text-text-primary')}>
        {value}
      </span>
    </div>
  )
}
