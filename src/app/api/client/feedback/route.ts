import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const body = await request.json()
  const { message, category } = body

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message requis' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()

  // Get client name
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', session.user.id)
    .single()

  // Store feedback as a support ticket tagged as feedback
  const { error } = await adminSupabase.from('support_tickets').insert({
    client_id: session.user.id,
    subject: `[Feedback Hub] ${category || 'Général'}`,
    description: message.trim(),
    status: 'open',
    priority: 'low',
    metadata: {
      source: 'hub_feedback',
      category: category || 'autre',
      client_name: profile?.full_name || '',
      client_email: profile?.email || '',
    },
  })

  if (error) {
    console.error('[Feedback] Insert error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  // Notify admin (best-effort — function may not exist yet)
  try {
    await adminSupabase.rpc('notify_admins', {
      p_type: 'feedback',
      p_title: `Feedback client : ${category || 'Général'}`,
      p_body: message.trim().substring(0, 120),
      p_link: '/admin/support',
    })
  } catch {
    // Non-blocking
  }

  return NextResponse.json({ ok: true })
}
