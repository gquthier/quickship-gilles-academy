import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient, createAdminClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
  })

  // Verify admin auth
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  try {
    const [charges, subscriptions] = await Promise.all([
      stripe.charges.list({ limit: 100, expand: ['data.customer'] }),
      stripe.subscriptions.list({ status: 'active', limit: 100, expand: ['data.customer'] }),
    ])

    // Time boundaries
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))
    startOfWeek.setHours(0, 0, 0, 0)

    const succeeded = charges.data.filter((c) => c.status === 'succeeded')

    let thisMonth = 0
    let lastMonth = 0
    let thisWeek = 0

    for (const charge of succeeded) {
      const chargeDate = new Date(charge.created * 1000)
      if (chargeDate >= startOfMonth) thisMonth += charge.amount
      if (chargeDate >= startOfLastMonth && chargeDate <= endOfLastMonth) lastMonth += charge.amount
      if (chargeDate >= startOfWeek) thisWeek += charge.amount
    }

    // MRR from active subscriptions
    let mrr = 0
    for (const sub of subscriptions.data) {
      for (const item of sub.items.data) {
        const amount = item.price?.unit_amount ?? 0
        const interval = item.price?.recurring?.interval
        if (interval === 'year') {
          mrr += Math.round(amount / 12)
        } else {
          mrr += amount
        }
      }
    }

    // Trend
    const trend = lastMonth > 0
      ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
      : null

    // Recent payments (10)
    const recentPayments = succeeded.slice(0, 10).map((charge) => {
      const customer = charge.customer as Stripe.Customer | null
      return {
        id: charge.id,
        amount: charge.amount,
        currency: charge.currency,
        status: charge.status,
        created: charge.created,
        customerName: customer?.name || customer?.email || 'Client inconnu',
        customerEmail: customer?.email || null,
      }
    })

    // Aggregate spending by customer
    const customerMap = new Map<string, { name: string; email: string | null; totalSpent: number; chargeCount: number }>()
    for (const charge of succeeded) {
      const customer = charge.customer as Stripe.Customer | null
      const key = customer?.id || charge.id
      const existing = customerMap.get(key)
      if (existing) {
        existing.totalSpent += charge.amount
        existing.chargeCount++
      } else {
        customerMap.set(key, {
          name: customer?.name || customer?.email || 'Client inconnu',
          email: customer?.email || null,
          totalSpent: charge.amount,
          chargeCount: 1,
        })
      }
    }

    // Match Stripe emails to Supabase profiles
    const emails = Array.from(customerMap.values()).map((c) => c.email).filter(Boolean) as string[]
    const adminClient = createAdminClient()
    const { data: matchedProfiles } = await adminClient
      .from('profiles')
      .select('email, full_name')
      .in('email', emails)

    const profileMap = new Map<string, string>()
    if (matchedProfiles) {
      for (const p of matchedProfiles) {
        profileMap.set(p.email, p.full_name)
      }
    }

    const customerSpending = Array.from(customerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .map((c) => ({
        ...c,
        matchedProfileName: c.email ? profileMap.get(c.email) ?? null : null,
      }))

    return NextResponse.json({
      revenue: { thisMonth, lastMonth, thisWeek, mrr, trend },
      recentPayments,
      customerSpending,
      activeSubscriptions: subscriptions.data.length,
    })
  } catch (err: any) {
    console.error('Stripe API error:', err)
    return NextResponse.json({ error: err.message || 'Erreur Stripe' }, { status: 500 })
  }
}
