import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { generateProjectPrompt } from '@/lib/generate-prompt'
import type { OnboardingResponse } from '@/types'

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

async function generateGeminiPrompt(basePrompt: string): Promise<string | null> {
  const geminiKey = process.env.GEMINI_API_KEY
  if (!geminiKey) return null

  const META_PROMPT = `Tu es un expert en développement web fullstack et en UX/UI design. Améliore ce brief pour qu'un agent IA puisse créer le site en one-shot. Inclure : architecture UX détaillée, UI précise (couleurs hex, typo, grid), copywriting complet, spécifications responsive. Brief :\n\n{base_prompt}\n\nRetourne UNIQUEMENT le prompt retravaillé.`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: META_PROMPT.replace('{base_prompt}', basePrompt) }] }],
        }),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    return (data.candidates?.[0]?.content?.parts?.[0]?.text as string) ?? null
  } catch {
    return null
  }
}

async function notifyBuilder(projectId: string, clientEmail: string, prompt: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_BUILDER_CHAT_ID
  if (!botToken || !chatId) return

  const preview = prompt.slice(0, 3500)
  const truncated = prompt.length > 3500 ? '\n[...tronqué]' : ''
  const message = `[QuickShip] Nouveau projet a builder\n\nClient: ${clientEmail}\nProject ID: ${projectId}\n\n---PROMPT---\n${preview}${truncated}`

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: parseInt(chatId), text: message }),
    })
  } catch {
    // non-fatal
  }
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
    const email: string | undefined = responses.email
    let projectId: string | null = null

    // 2. Auto-process si email présent
    if (email && email.includes('@')) {
      try {
        const fullName: string = responses.fullname || responses.full_name || 'Client'
        const phone: string | null = responses.phone || null
        const projectName: string = responses.project_name || 'Projet sans nom'
        const domainName: string | null = responses.domain_name || responses.domain || null

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

        await adminClient.from('profiles').upsert({
          id: clientId,
          email,
          full_name: fullName,
          phone,
          company: projectName,
          role: 'client',
          is_active: true,
        }, { onConflict: 'id' })

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
        projectId = projectData.id

        await adminClient
          .from('onboarding_responses')
          .update({ client_id: clientId, project_id: projectId })
          .eq('id', onboardingId)

        console.log(`✅ Auto-processed: ${email} → client ${clientId}, project ${projectId}`)

        // 3. Background: generate Gemini prompt + notify builder (me / Griffe via Telegram)
        void (async () => {
          try {
            const { data: onboardingFull } = await adminClient
              .from('onboarding_responses')
              .select('*, client:profiles!client_id(full_name, email, company), project:projects(name)')
              .eq('id', onboardingId)
              .single()

            if (!onboardingFull) return

            const basePrompt = generateProjectPrompt(onboardingFull as OnboardingResponse)
            const aiPrompt = await generateGeminiPrompt(basePrompt)
            const finalPrompt = aiPrompt || basePrompt

            if (aiPrompt) {
              await adminClient
                .from('projects')
                .update({ ai_prompt: aiPrompt })
                .eq('id', projectId!)
            }

            await notifyBuilder(projectId!, email, finalPrompt)
          } catch (err) {
            console.error('Background builder trigger error (non-fatal):', err)
          }
        })()

      } catch (processErr) {
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
