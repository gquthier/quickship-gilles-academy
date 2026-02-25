import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase-server'
import { generateProjectPrompt } from '@/lib/generate-prompt'
import type { OnboardingResponse } from '@/types'

const META_PROMPT = `Tu es un expert en prompt engineering, en développement web fullstack et en UX/UI design.

Je vais te donner un prompt de brief pour la création d'un site web. Tu dois me le retravailler pour le rendre beaucoup plus spécifique et détaillé, afin qu'un agent IA puisse one-shot complètement le projet.

Tu dois inclure :
- Une architecture UX détaillée (sitemap, parcours utilisateur, wireframes textuels)
- Des directives UI précises (palette couleurs exacte avec hex, typographie, espacements, grid system)
- Le copywriting complet pour chaque section de chaque page
- Des idées visuelles concrètes (hero section, animations, micro-interactions)
- Les composants à créer avec leur structure exacte
- Les spécifications responsive (mobile, tablet, desktop)

Voici le prompt de base :

{base_prompt}

Retourne UNIQUEMENT le prompt retravaillé, sans commentaire ni explication.`

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
  const { project_id, onboarding_response_id } = body

  if (!project_id || !onboarding_response_id) {
    return NextResponse.json({ error: 'project_id et onboarding_response_id requis' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  // Fetch the onboarding response with relations
  const { data: onboarding, error: fetchError } = await adminClient
    .from('onboarding_responses')
    .select('*, client:profiles(full_name, email, company), project:projects(name)')
    .eq('id', onboarding_response_id)
    .single()

  if (fetchError || !onboarding) {
    return NextResponse.json({ error: 'Réponse d\'onboarding introuvable' }, { status: 404 })
  }

  // Generate the base prompt
  const basePrompt = generateProjectPrompt(onboarding as OnboardingResponse)

  // Build the full prompt for Gemini
  const fullPrompt = META_PROMPT.replace('{base_prompt}', basePrompt)

  // Call Gemini API
  const geminiKey = process.env.GEMINI_API_KEY
  if (!geminiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY non configurée' }, { status: 500 })
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
        }),
      }
    )

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text()
      return NextResponse.json({ error: `Erreur Gemini: ${errBody}` }, { status: 502 })
    }

    const geminiData = await geminiRes.json()
    const aiPrompt = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!aiPrompt) {
      return NextResponse.json({ error: 'Réponse Gemini vide ou invalide' }, { status: 502 })
    }

    // Save to DB
    const { error: updateError } = await adminClient
      .from('projects')
      .update({ ai_prompt: aiPrompt })
      .eq('id', project_id)

    if (updateError) {
      return NextResponse.json({ error: `Erreur sauvegarde: ${updateError.message}` }, { status: 500 })
    }

    return NextResponse.json({ ai_prompt: aiPrompt })
  } catch (err: any) {
    return NextResponse.json({ error: `Erreur appel Gemini: ${err.message}` }, { status: 500 })
  }
}
