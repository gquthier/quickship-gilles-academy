'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { TopBar } from '@/components/layout/TopBar'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import { Users, Plus, Mail, Building2, Phone } from 'lucide-react'
import Link from 'next/link'
import { useAdminMobileMenu } from '../layout'
import type { Profile } from '@/types'

export default function ClientsPage() {
  const [clients, setClients] = useState<(Profile & { project_count?: number })[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const onMenuToggle = useAdminMobileMenu()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'client')
        .order('created_at', { ascending: false })

      if (data) {
        // Get project counts
        const clientsWithCounts = await Promise.all(
          data.map(async (client) => {
            const { count } = await supabase
              .from('projects')
              .select('*', { count: 'exact', head: true })
              .eq('client_id', client.id)
            return { ...client, project_count: count || 0 }
          })
        )
        setClients(clientsWithCounts as any)
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = search
    ? clients.filter(c =>
        c.full_name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        (c.company || '').toLowerCase().includes(search.toLowerCase())
      )
    : clients

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
        title="Clients"
        subtitle={`${clients.length} client${clients.length !== 1 ? 's' : ''}`}
        onMenuToggle={onMenuToggle}
        actions={
          <Link href="/admin/clients/new" className="btn-primary text-xs gap-1.5">
            <Plus className="w-4 h-4" /> Nouveau client
          </Link>
        }
      />

      <div className="p-4 md:p-8">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            className="input max-w-md"
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun client"
            description={search ? "Aucun résultat pour cette recherche." : "Commencez par ajouter votre premier client."}
            action={
              !search ? (
                <Link href="/admin/clients/new" className="btn-primary text-xs gap-1.5">
                  <Plus className="w-4 h-4" /> Ajouter un client
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((client) => (
              <Link key={client.id} href={`/admin/clients/${client.id}`} className="card hover:shadow-card-hover transition-shadow group">
                <div className="flex items-start gap-4 mb-4">
                  <Avatar name={client.full_name} src={client.avatar_url} size="lg" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-text-primary truncate">{client.full_name}</h3>
                    {client.company && (
                      <p className="text-sm text-text-secondary flex items-center gap-1 truncate">
                        <Building2 className="w-3.5 h-3.5" /> {client.company}
                      </p>
                    )}
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${client.is_active ? 'bg-emerald-400' : 'bg-text-muted'}`} title={client.is_active ? 'Actif' : 'Inactif'} />
                </div>

                <div className="space-y-2 text-sm text-text-secondary">
                  <p className="flex items-center gap-2 truncate">
                    <Mail className="w-4 h-4 text-text-muted" /> {client.email}
                  </p>
                  {client.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-text-muted" /> {client.phone}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-surface-border text-xs text-text-muted">
                  <span>{client.project_count} projet{(client.project_count || 0) !== 1 ? 's' : ''}</span>
                  <span>Depuis le {formatDate(client.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
