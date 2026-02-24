'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { TopBar } from '@/components/layout/TopBar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, getStatusLabel } from '@/lib/utils'
import { CreditCard, CheckCircle2 } from 'lucide-react'
import type { Subscription } from '@/types'

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data } = await supabase
        .from('subscriptions')
        .select('*, project:projects(name, domain)')
        .eq('client_id', session.user.id)
        .order('created_at', { ascending: false })

      setSubscriptions(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-[3px] border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    )
  }

  const planFeatures: Record<string, string[]> = {
    starter: ['Hébergement inclus', 'Support email', '1 modification/mois', 'Certificat SSL'],
    pro: ['Hébergement inclus', 'Support prioritaire', '5 modifications/mois', 'Certificat SSL', 'Analytics avancées', 'Backups quotidiens'],
    enterprise: ['Hébergement dédié', 'Support 24/7', 'Modifications illimitées', 'Certificat SSL', 'Analytics avancées', 'Backups quotidiens', 'SLA garanti', 'Account manager dédié'],
  }

  return (
    <>
      <TopBar title="Abonnements" subtitle="Gérez vos plans et abonnements" />

      <div className="p-8">
        {subscriptions.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="Aucun abonnement"
            description="Vous n'avez pas encore d'abonnement actif."
          />
        ) : (
          <div className="space-y-6">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="card">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-display font-bold text-xl text-gray-900">
                        Plan {getStatusLabel(sub.plan)}
                      </h3>
                      <StatusBadge status={sub.status} />
                    </div>
                    {sub.project && (
                      <p className="text-sm text-gray-500">
                        {(sub.project as any).name} {(sub.project as any).domain && `· ${(sub.project as any).domain}`}
                      </p>
                    )}
                  </div>
                  {sub.price_monthly && (
                    <div className="text-right">
                      <p className="font-display font-bold text-2xl text-gray-900">{sub.price_monthly} &euro;</p>
                      <p className="text-xs text-gray-400">/ mois</p>
                    </div>
                  )}
                </div>

                {/* Plan features */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {(planFeatures[sub.plan] || []).map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>

                {/* Dates */}
                <div className="flex items-center gap-6 pt-4 border-t border-gray-100 text-xs text-gray-400">
                  <span>Début : {formatDate(sub.start_date)}</span>
                  {sub.end_date && <span>Fin : {formatDate(sub.end_date)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
