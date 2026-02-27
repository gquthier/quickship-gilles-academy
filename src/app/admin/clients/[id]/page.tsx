'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { TopBar } from '@/components/layout/TopBar'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate } from '@/lib/utils'
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  FolderKanban,
  CreditCard,
  LifeBuoy,
  Save,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import Link from 'next/link'
import { useAdminMobileMenu } from '@/context/admin-mobile-menu'
import type { Profile, Project, Subscription, SupportTicket } from '@/types'

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const [client, setClient] = useState<Profile | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({ full_name: '', company: '', phone: '' })
  const onMenuToggle = useAdminMobileMenu()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [
        { data: clientData },
        { data: projectsData },
        { data: subsData },
        { data: ticketsData },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', params.id).single(),
        supabase.from('projects').select('*').eq('client_id', params.id).order('created_at', { ascending: false }),
        supabase.from('subscriptions').select('*, project:projects(name)').eq('client_id', params.id),
        supabase.from('support_tickets').select('*').eq('client_id', params.id).order('created_at', { ascending: false }).limit(10),
      ])

      if (clientData) {
        setClient(clientData as Profile)
        setEditData({
          full_name: clientData.full_name,
          company: clientData.company || '',
          phone: clientData.phone || '',
        })
      }
      setProjects(projectsData || [])
      setSubscriptions(subsData || [])
      setTickets(ticketsData || [])
      setLoading(false)
    }
    load()
  }, [params.id])

  async function handleSave() {
    if (!client) return
    setSaving(true)
    await supabase.from('profiles').update({
      full_name: editData.full_name,
      company: editData.company || null,
      phone: editData.phone || null,
    }).eq('id', client.id)
    setClient({ ...client, ...editData } as Profile)
    setEditMode(false)
    setSaving(false)
  }

  async function toggleActive() {
    if (!client) return
    const newState = !client.is_active
    await supabase.from('profiles').update({ is_active: newState }).eq('id', client.id)
    setClient({ ...client, is_active: newState })
  }

  if (loading || !client) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-[3px] border-surface-border border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <TopBar title={client.full_name} subtitle={client.company || client.email} onMenuToggle={onMenuToggle} />

      <div className="p-4 md:p-8">
        <Link href="/admin/clients" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour aux clients
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Client Info */}
          <div className="space-y-3 md:space-y-6">
            <div className="card">
              <div className="flex items-center gap-4 mb-6">
                <Avatar name={client.full_name} src={client.avatar_url} size="lg" />
                <div>
                  <h2 className="font-display font-bold text-lg">{client.full_name}</h2>
                  <p className="text-sm text-text-secondary">{client.company || 'Particulier'}</p>
                </div>
              </div>

              {editMode ? (
                <div className="space-y-3">
                  <div>
                    <label className="label">Nom</label>
                    <input type="text" className="input" value={editData.full_name} onChange={(e) => setEditData({ ...editData, full_name: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Entreprise</label>
                    <input type="text" className="input" value={editData.company} onChange={(e) => setEditData({ ...editData, company: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Téléphone</label>
                    <input type="tel" className="input" value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={handleSave} disabled={saving} className="btn-primary text-xs flex-1 justify-center gap-1">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Sauvegarder
                    </button>
                    <button onClick={() => setEditMode(false)} className="btn-secondary text-xs flex-1 justify-center">Annuler</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Mail className="w-4 h-4 text-text-muted" /> {client.email}
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Phone className="w-4 h-4 text-text-muted" /> {client.phone}
                    </div>
                  )}
                  {client.company && (
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Building2 className="w-4 h-4 text-text-muted" /> {client.company}
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-3 border-t border-surface-border">
                    <button onClick={() => setEditMode(true)} className="btn-secondary text-xs flex-1 justify-center">Modifier</button>
                    <button onClick={toggleActive} className={`text-xs flex items-center gap-1 px-3 py-2 rounded-xl ${client.is_active ? 'text-emerald-400' : 'text-text-muted'}`}>
                      {client.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      {client.is_active ? 'Actif' : 'Inactif'}
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-surface-border text-xs text-text-muted">
                Client depuis le {formatDate(client.created_at)}
              </div>
            </div>
          </div>

          {/* Projects & Activity */}
          <div className="lg:col-span-2 space-y-3 md:space-y-6">
            {/* Projects */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold flex items-center gap-2">
                  <FolderKanban className="w-5 h-5 text-accent" /> Projets ({projects.length})
                </h3>
                <Link href={`/admin/projects/new?client=${client.id}`} className="text-xs text-accent hover:text-accent-hover">+ Ajouter</Link>
              </div>
              {projects.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">Aucun projet</p>
              ) : (
                <div className="divide-y divide-surface-border">
                  {projects.map((p) => (
                    <Link key={p.id} href={`/admin/projects/${p.id}`} className="flex items-center gap-3 py-3 hover:bg-surface-hover px-2 rounded-lg transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-text-muted">{p.domain || 'Pas de domaine'}</p>
                      </div>
                      <StatusBadge status={p.status} />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Subscriptions */}
            <div className="card">
              <h3 className="font-display font-bold flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-emerald-400" /> Abonnements ({subscriptions.length})
              </h3>
              {subscriptions.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">Aucun abonnement</p>
              ) : (
                <div className="divide-y divide-surface-border">
                  {subscriptions.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 py-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium capitalize">{s.plan}</p>
                        <p className="text-xs text-text-muted">{(s.project as any)?.name || 'Général'}</p>
                      </div>
                      {s.price_monthly && <p className="text-sm font-bold">{s.price_monthly}&euro;/mois</p>}
                      <StatusBadge status={s.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Tickets */}
            <div className="card">
              <h3 className="font-display font-bold flex items-center gap-2 mb-4">
                <LifeBuoy className="w-5 h-5 text-orange-400" /> Tickets récents ({tickets.length})
              </h3>
              {tickets.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">Aucun ticket</p>
              ) : (
                <div className="divide-y divide-surface-border">
                  {tickets.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center gap-3 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.subject}</p>
                        <p className="text-xs text-text-muted">{formatDate(t.created_at)}</p>
                      </div>
                      <StatusBadge status={t.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
