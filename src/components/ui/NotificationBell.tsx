'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Bell, X, ExternalLink, CheckCheck, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  read: boolean
  created_at: string
}

const TYPE_CONFIG: Record<string, { color: string; dot: string }> = {
  new_client:     { color: 'text-accent',   dot: 'bg-accent' },
  new_ticket:     { color: 'text-red-400',  dot: 'bg-red-400' },
  ticket_reply:   { color: 'text-blue-400', dot: 'bg-blue-400' },
  project_update: { color: 'text-accent',   dot: 'bg-accent' },
  payment:        { color: 'text-green-400',dot: 'bg-green-400' },
  deadline:       { color: 'text-orange-400', dot: 'bg-orange-400' },
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const unreadCount = notifications.filter(n => !n.read).length

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/notifications?limit=30')
    if (res.ok) {
      const data = await res.json()
      setNotifications(data.notifications || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  async function markAsRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }

  async function markAllAsRead() {
    setMarkingAll(true)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
    setMarkingAll(false)
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'relative p-2 rounded-lg transition-all',
          open
            ? 'bg-surface-light text-text-primary'
            : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
        )}
      >
        <Bell className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-accent text-bg text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[360px] bg-bg border border-surface-border rounded-xl shadow-card-hover z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-text-secondary" />
              <h3 className="text-[13px] font-semibold text-text-primary">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-accent/10 text-accent text-[10px] font-bold rounded-full">
                  {unreadCount} non lues
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={markingAll}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-text-muted hover:text-accent hover:bg-accent/5 transition-all"
                >
                  {markingAll
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <CheckCheck className="w-3 h-3" />
                  }
                  Tout lire
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Notifications list */}
          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-text-muted animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Bell className="w-8 h-8 text-text-muted opacity-30" />
                <p className="text-[12px] text-text-muted">Aucune notification</p>
              </div>
            ) : (
              notifications.map(notif => {
                const config = TYPE_CONFIG[notif.type] || { color: 'text-text-secondary', dot: 'bg-text-muted' }
                const content = (
                  <div
                    key={notif.id}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                    className={cn(
                      'flex gap-3 px-4 py-3.5 border-b border-surface-border last:border-0 transition-colors cursor-pointer group',
                      !notif.read
                        ? 'bg-surface hover:bg-surface-hover'
                        : 'hover:bg-surface-hover/50'
                    )}
                  >
                    {/* Unread dot */}
                    <div className="flex-shrink-0 mt-1.5">
                      <div className={cn(
                        'w-2 h-2 rounded-full transition-all',
                        !notif.read ? config.dot : 'bg-transparent'
                      )} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-[12px] font-medium leading-tight truncate',
                        !notif.read ? 'text-text-primary' : 'text-text-secondary'
                      )}>
                        {notif.title}
                      </p>
                      {notif.body && (
                        <p className="text-[11px] text-text-muted mt-0.5 truncate">{notif.body}</p>
                      )}
                      <p className="text-[10px] text-text-muted mt-1">
                        {formatDistanceToNow(new Date(notif.created_at))}
                      </p>
                    </div>

                    {/* External link icon */}
                    {notif.link && (
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                        <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
                      </div>
                    )}
                  </div>
                )

                return notif.link ? (
                  <Link key={notif.id} href={notif.link} onClick={() => { markAsRead(notif.id); setOpen(false) }}>
                    {content}
                  </Link>
                ) : (
                  <div key={notif.id}>{content}</div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-surface-border">
              <p className="text-[10px] text-text-muted text-center">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''} · Mises à jour en temps réel
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
