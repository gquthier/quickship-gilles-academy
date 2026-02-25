import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase-server'

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let result = 'QS-'
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

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
  const { onboarding_response_id } = body

  if (!onboarding_response_id) {
    return NextResponse.json({ error: 'onboarding_response_id requis' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  // 1. Fetch the onboarding response
  const { data: onboarding, error: fetchError } = await adminClient
    .from('onboarding_responses')
    .select('*')
    .eq('id', onboarding_response_id)
    .single()

  if (fetchError || !onboarding) {
    return NextResponse.json({ error: 'Réponse d\'onboarding introuvable' }, { status: 404 })
  }

  // Check if already processed
  if (onboarding.client_id && onboarding.project_id) {
    return NextResponse.json({ error: 'Cette réponse a déjà été traitée' }, { status: 400 })
  }

  const responses = onboarding.responses as Record<string, any>

  const fullName = responses.fullname || responses.full_name || 'Client'
  const email = responses.email
  const phone = responses.phone || null
  const projectName = responses.project_name || 'Projet sans nom'
  const domainName = responses.domain_name || responses.domain || null

  if (!email) {
    return NextResponse.json({ error: 'Email manquant dans les réponses d\'onboarding' }, { status: 400 })
  }

  // 2. Create the auth user
  const tempPassword = generatePassword()

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: 'client',
    },
  })

  if (authError) {
    return NextResponse.json({ error: `Erreur création utilisateur: ${authError.message}` }, { status: 400 })
  }

  const clientId = authData.user.id

  // 3. Update the profile
  await adminClient.from('profiles').update({
    phone,
    company: projectName,
  }).eq('id', clientId)

  // 4. Create the project
  const { data: projectData, error: projectError } = await adminClient
    .from('projects')
    .insert({
      client_id: clientId,
      name: projectName,
      domain: domainName,
      status: 'draft',
      delivery_status: 'not_started',
      tech_stack: ['Next.js', 'Tailwind CSS', 'TypeScript'],
    })
    .select()
    .single()

  if (projectError) {
    return NextResponse.json({ error: `Erreur création projet: ${projectError.message}` }, { status: 400 })
  }

  // 5. Link the onboarding response to client and project
  await adminClient.from('onboarding_responses').update({
    client_id: clientId,
    project_id: projectData.id,
  }).eq('id', onboarding_response_id)

  return NextResponse.json({
    client_id: clientId,
    project_id: projectData.id,
    temp_password: tempPassword,
  })
}
