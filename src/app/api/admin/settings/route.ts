import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'admin') return null
  return session.user.id
}

export async function GET() {
  const userId = await requireAdmin()
  if (!userId) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const adminClient = createAdminClient()
  const { data: { user } } = await adminClient.auth.admin.getUserById(userId)
  const meta = user?.user_metadata ?? {}

  return NextResponse.json({
    has_gemini_key: !!meta.gemini_key,
    gemini_key_preview: meta.gemini_key
      ? meta.gemini_key.slice(0, 8) + '••••••••••••••••••••'
      : null,
  })
}

export async function PATCH(request: NextRequest) {
  const userId = await requireAdmin()
  if (!userId) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const body = await request.json()
  const { gemini_key } = body

  if (gemini_key !== undefined && typeof gemini_key !== 'string') {
    return NextResponse.json({ error: 'gemini_key invalide' }, { status: 400 })
  }

  const adminClient = createAdminClient()
  const { data: { user } } = await adminClient.auth.admin.getUserById(userId)
  const existingMeta = user?.user_metadata ?? {}

  const updatedMeta = { ...existingMeta }
  if (gemini_key === '') {
    delete updatedMeta.gemini_key
  } else if (gemini_key) {
    updatedMeta.gemini_key = gemini_key
  }

  await adminClient.auth.admin.updateUserById(userId, { user_metadata: updatedMeta })

  return NextResponse.json({ success: true })
}
