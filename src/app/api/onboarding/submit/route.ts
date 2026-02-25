import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let result = 'QS-'
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { questionnaire_type, submitted_at, responses } = body

    if (!responses) {
      return NextResponse.json(
        { error: 'responses requis' },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    const adminClient = createAdminClient()

    // 1. Insérer la réponse d'onboarding
    const { data: onboardingRow, error: insertError } = await adminClient
      .from('onboarding_responses')
      .insert({
        questionnaire_type: questionnaire_type || 'website',
        submitted_at: submitted_at || new Date().toISOString(),
        responses,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return NextResponse.json(
        { error: insertError.message },
        { status: 500, headers: CORS_HEADERS }
      )
    }

    const onboardingId = onboardingRow.id

    // 2. Auto-process si email présent
    const email: string | undefined = responses.email
    if (email && email.includes('@')) {
      try {
        const fullName: string = responses.fullname || responses.full_name || 'Client'
        const phone: string | null = responses.phone || null
        const projectName: string = responses.project_name || 'Projet sans nom'
        const domainName: string | null = responses.domain_name || responses.domain || null

        // Vérifier si l'user existe déjà
        const { data: existingUsers } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
        const existingUser = existingUsers?.users?.find(u => u.email === email)

        let clientId: string

        if (existingUser) {
          clientId = existingUser.id
        } else {
          const tempPassword = generatePassword()
          const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { full_name: fullName, role: 'client' },
          })
          if (authError) throw new Error(`Auth: ${authError.message}`)
          clientId = authData.user.id
        }

        // Upsert profile
        await adminClient.from('profiles').upsert({
          id: clientId,
          email,
          full_name: fullName,
          phone,
          company: projectName,
          role: 'client',
          is_active: true,
        }, { onConflict: 'id' })

        // Créer le projet
        const resolvedDomain =
          domainName && domainName !== 'oui' && domainName !== 'non' ? domainName : null

        const { data: projectData, error: projectError } = await adminClient
          .from('projects')
          .insert({
            client_id: clientId,
            name: projectName,
            domain: resolvedDomain,
            status: 'draft',
            delivery_status: 'not_started',
            tech_stack: ['Next.js', 'Tailwind CSS', 'TypeScript'],
          })
          .select('id')
          .single()

        if (projectError) throw new Error(`Project: ${projectError.message}`)

        // Lier onboarding_response au client et au projet
        await adminClient
          .from('onboarding_responses')
          .update({ client_id: clientId, project_id: projectData.id })
          .eq('id', onboardingId)

        console.log(`✅ Auto-processed: ${email} → client ${clientId}, project ${projectData.id}`)
      } catch (processErr) {
        // Ne pas bloquer la réponse — l'entrée onboarding est déjà insérée
        console.error('Auto-process error (non-fatal):', processErr)
      }
    }

    return NextResponse.json(
      { success: true },
      { status: 201, headers: CORS_HEADERS }
    )
  } catch (err) {
    console.error('Submit error:', err)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
