'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { TopBar } from '@/components/layout/TopBar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import { RefreshCw, Plus, Clock } from 'lucide-react'
import Link from 'next/link'
import type { UpdateRequest } from '@/types'

export default function UpdatesPage() {
  const [updates, setUpdates] = useState<UpdateRequest[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data } = await supabase
        .from('update_requests')
        .select('*, project:projects(name)')
        .eq('client_id', session.user.id)
        .order('created_at', { ascending: false })

      setUpdates(data || [])
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
      <TopBar
        title="Demandes de modification"
        subtitle="Suivez vos demandes de mise à jour"
        actions={
          <Link href="/updates/new" className="btn-primary text-xs gap-1.5">
            <Plus className="w-4 h-4" /> Nouvelle demande
          </Link>
        }
      />

      <div className="p-8">
        {updates.length === 0 ? (
          <EmptyState
            icon={RefreshCw}
            title="Aucune demande"
            description="Vous n'avez pas encore fait de demande de modification."
            action={
              <Link href="/updates/new" className="btn-primary text-xs gap-1.5">
                <Plus className="w-4 h-4" /> Faire une demande
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {updates.map((update) => (
              <div key={update.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display font-semibold text-slate-900">{update.title}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                      {(update as any).project?.name && <span>{(update as any).project.name}</span>}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDate(update.created_at)}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={update.priority} />
                    <StatusBadge status={update.status} />
                  </div>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2">{update.description}</p>
                {update.estimated_hours && (
                  <p className="text-xs text-slate-400 mt-2">
                    Estimation : {update.estimated_hours}h
                  </p>
                )}
                {update.admin_notes && (
                  <div className="mt-3 p-3 rounded-xl bg-purple-50 text-sm text-purple-700">
                    <p className="text-xs font-semibold mb-1">Note de l'équipe :</p>
                    {update.admin_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
