import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase-server'

const SYSTEM_PROMPT = `Tu es l'assistant IA de QuickShip, une agence web spécialisée dans la création de sites web et d'applications en one-shot pour des startups et PMEs.

Tu aides les admins QuickShip à :
- Générer des propositions commerciales pour les clients
- Rédiger des réponses aux tickets de support
- Analyser les KPIs et donner des recommandations
- Créer des emails professionnels
- Proposer des améliorations aux projets en cours
- Résoudre des problèmes techniques

Tu connais le contexte QuickShip : stack Next.js + Supabase + Vercel, clients PMEs français et internationaux, plans d'abonnement (Starter/Pro/Enterprise).

Réponds toujours en français sauf si on te demande explicitement une autre langue.
Sois direct, professionnel et actionnable. Donne des réponses concrètes avec du contenu prêt à l'emploi.`

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Accès réservé aux admins' }, { status: 403 })
  }

  const { messages, context } = await request.json()

  if (!messages?.length) {
    return NextResponse.json({ error: 'Messages requis' }, { status: 400 })
  }

  const geminiKey = process.env.GEMINI_API_KEY
  if (!geminiKey) {
    return NextResponse.json({ error: 'Clé API Gemini non configurée' }, { status: 500 })
  }

  // Build the conversation for Gemini
  // Gemini uses "user"/"model" roles, first message must be "user"
  const contextBlock = context
    ? `\n\n## Contexte actuel QuickShip\n${context}`
    : ''

  const systemWithContext = SYSTEM_PROMPT + contextBlock

  // Flatten messages for Gemini's multi-turn format
  const geminiContents = messages.map((m: { role: string; content: string }) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  // Inject system prompt as the first user message if conversation starts fresh
  const firstIsUser = geminiContents[0]?.role === 'user'
  if (firstIsUser) {
    geminiContents[0].parts[0].text =
      `[Instructions système]\n${systemWithContext}\n\n[Message]\n${geminiContents[0].parts[0].text}`
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: geminiContents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      }
    )

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text()
      return NextResponse.json({ error: `Erreur Gemini: ${errBody}` }, { status: 502 })
    }

    const data = await geminiRes.json()
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!reply) {
      return NextResponse.json({ error: 'Réponse Gemini vide' }, { status: 502 })
    }

    return NextResponse.json({ reply })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: `Erreur: ${message}` }, { status: 500 })
  }
}
