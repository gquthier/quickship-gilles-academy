import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  // Verify the requester is an admin
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

  const body = await request.json()
  const { email, full_name, company, phone, password } = body

  if (!email || !full_name || !password) {
    return NextResponse.json({ error: 'Email, nom et mot de passe requis' }, { status: 400 })
  }

  // Use admin client to create the user
  const adminClient = createAdminClient()

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name,
      role: 'client',
    },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // Update the profile with additional info
  if (authData.user) {
    await adminClient.from('profiles').update({
      company: company || null,
      phone: phone || null,
    }).eq('id', authData.user.id)
  }

  return NextResponse.json({ user: authData.user })
}
