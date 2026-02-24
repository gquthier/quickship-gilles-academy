'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { TopBar } from '@/components/layout/TopBar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, getStatusLabel } from '@/lib/utils'
import { CreditCard, CheckCircle2 } from 'lucide-react'
import type { Subscription } from '@/types'
import { useMobileMenu } from '../layout'

export default function SubscriptionsPage() {
  const onMenuToggle = useMobileMenu()
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
        <div className="w-8 h-8 border-[3px] border-surface-border border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  const planFeatures: Record<string, string[]> = {
    starter: ['H\u00e9bergement inclus', 'Support email', '1 modification/mois', 'Certificat SSL'],
    pro: ['H\u00e9bergement inclus', 'Support prioritaire', '5 modifications/mois', 'Certificat SSL', 'Analytics avanc\u00e9es', 'Backups quotidiens'],
    enterprise: ['H\u00e9bergement d\u00e9di\u00e9', 'Support 24/7', 'Modifications illimit\u00e9es', 'Certificat SSL', 'Analytics avanc\u00e9es', 'Backups quotidiens', 'SLA garanti', 'Account manager d\u00e9di\u00e9'],
  }

  return (
    <>
      <TopBar title="Abonnements" subtitle="G\u00e9rez vos plans et abonnements" onMenuToggle={onMenuToggle} />

      <div className="p-4 md:p-8">
        {subscriptions.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="Aucun abonnement"
            description="Vous n'avez pas encore d'abonnement actif."
          />
        ) : (
          <div className="space-y-3 md:space-y-6">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="card">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-display font-bold text-xl text-text-primary">
                        Plan {getStatusLabel(sub.plan)}
                      </h3>
                      <StatusBadge status={sub.status} />
                    </div>
                    {sub.project && (
                      <p className="text-sm text-text-secondary">
                        {(sub.project as any).name} {(sub.project as any).domain && `\u00b7 ${(sub.project as any).domain}`}
                      </p>
                    )}
                  </div>
                  {sub.price_monthly && (
                    <div className="text-right">
                      <p className="font-display font-bold text-2xl text-text-primary">{sub.price_monthly} &euro;</p>
                      <p className="text-xs text-text-muted">/ mois</p>
                    </div>
                  )}
                </div>

                {/* Plan features */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {(planFeatures[sub.plan] || []).map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-text-secondary">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>

                {/* Dates */}
                <div className="flex items-center gap-3 md:gap-6 pt-4 border-t border-surface-border text-xs text-text-muted">
                  <span>D\u00e9but : {formatDate(sub.start_date)}</span>
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
