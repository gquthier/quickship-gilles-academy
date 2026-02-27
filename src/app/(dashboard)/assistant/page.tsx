'use client'

import { useEffect, useRef, useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import {
  Sparkles, Send, Bot, User, Loader2,
  RefreshCw, FolderKanban, Globe, TrendingUp, Copy, Check,
  Lightbulb, FileText, MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMobileMenu } from '@/context/mobile-menu'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const QUICK_PROMPTS = [
  {
    icon: TrendingUp,
    label: 'Améliorer mon SEO',
    prompt: 'Quelles sont les 5 choses les plus importantes à faire pour améliorer le référencement naturel de mon site web ?',
  },
  {
    icon: FolderKanban,
    label: 'Statut de mon projet',
    prompt: 'Peux-tu me faire un point rapide sur l\'avancement de mon projet et ce qui reste à faire ?',
  },
  {
    icon: Globe,
    label: 'Idées de contenu',
    prompt: 'Propose-moi 5 idées de pages ou de contenu à ajouter sur mon site pour augmenter les conversions.',
  },
  {
    icon: FileText,
    label: 'Rédiger une page',
    prompt: 'Aide-moi à rédiger une page "À propos" percutante pour mon site web.',
  },
  {
    icon: MessageSquare,
    label: 'Demande de modif',
    prompt: 'Je voudrais modifier quelque chose sur mon site. Comment créer une demande de modification ?',
  },
  {
    icon: Lightbulb,
    label: 'Conseil marketing',
    prompt: 'Donne-moi 3 conseils concrets pour convertir plus de visiteurs en clients sur mon site.',
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
    <div className={cn('group flex gap-3 mb-5', isUser ? 'flex-row-reverse' : '')}>
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5',
        isUser
          ? 'bg-accent text-bg'
          : 'bg-surface border border-surface-border text-accent'
      )}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className={cn('flex-1 max-w-[80%] flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
        <div className={cn(
          'rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'bg-accent text-bg rounded-tr-md'
            : 'bg-surface border border-surface-border text-text-primary rounded-tl-md'
        )}>
          {message.content}
        </div>
        {!isUser && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-[11px] text-text-muted hover:text-text-secondary opacity-0 group-hover:opacity-100 transition-all duration-200 px-1"
          >
            {copied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function AssistantPage() {
  const onMenuToggle = useMobileMenu()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: text.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/client-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await res.json()
      if (data.reply) {
        setMessages(prev => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: 'assistant', content: data.reply },
        ])
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Désolé, une erreur est survenue. Réessayez.' },
      ])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text)
  }

  function clearChat() {
    setMessages([])
    setInput('')
    inputRef.current?.focus()
  }

  const isEmpty = messages.length === 0

  return (
    <>
      <TopBar
        title="Assistant IA"
        subtitle="Posez toutes vos questions sur votre site"
        onMenuToggle={onMenuToggle}
      />

      <div className="flex flex-col h-[calc(100vh-64px)]">

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          <div className="max-w-3xl mx-auto">

            {isEmpty ? (
              <div className="text-center mb-8 pt-6">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-5">
                  <Sparkles className="w-8 h-8 text-accent" />
                </div>
                <h2 className="font-display font-bold text-2xl text-text-primary mb-2">
                  Bonjour, comment puis-je vous aider ?
                </h2>
                <p className="text-text-muted text-sm max-w-md mx-auto mb-8">
                  Posez vos questions sur votre site, obtenez des conseils SEO, rédigez du contenu ou faites des demandes de modifications.
                </p>

                {/* Quick prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left">
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => sendMessage(p.prompt)}
                      className="card p-4 text-left hover:border-accent/30 hover:shadow-card-hover transition-all duration-200 group"
                    >
                      <p.icon className="w-4 h-4 text-accent mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-sm font-semibold text-text-primary mb-1">{p.label}</p>
                      <p className="text-xs text-text-muted line-clamp-2">{p.prompt}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {messages.map((m) => (
                  <MessageBubble key={m.id} message={m} onCopy={copyText} />
                ))}
                {loading && (
                  <div className="flex gap-3 mb-5">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface border border-surface-border text-accent flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-surface border border-surface-border rounded-2xl rounded-tl-md px-4 py-3">
                      <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-surface-border bg-bg px-4 md:px-8 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Posez votre question... (Entrée pour envoyer)"
                  rows={1}
                  className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors resize-none min-h-[48px] max-h-[160px]"
                  style={{ height: 'auto' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'
                    target.style.height = `${Math.min(target.scrollHeight, 160)}px`
                  }}
                />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="p-3 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover border border-surface-border transition-all duration-200"
                    title="Nouvelle conversation"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="p-3 rounded-xl bg-accent text-bg hover:bg-accent-hover transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-[11px] text-text-muted mt-2 text-center">
              L&apos;assistant IA peut se tromper — vérifiez les informations importantes
            </p>
          </div>
        </div>

      </div>
    </>
  )
}
