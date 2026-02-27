import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase-server'

const SYSTEM_PROMPT = `Tu es l'assistant IA de QuickShip, dédié aux clients. QuickShip est une agence web spécialisée dans la création de sites web et d'applications en one-shot pour des startups et PMEs françaises.

Tu aides les clients QuickShip à :
- Comprendre l'avancement de leur projet
- Obtenir des conseils SEO et marketing pour leur site
- Rédiger du contenu (textes, pages, descriptions)
- Comprendre les technologies utilisées (Next.js, Supabase, etc.)
- Trouver des idées pour améliorer leur site web
- Faire des demandes de modifications via l'espace client

Tu connais le contexte QuickShip : stack Next.js + Supabase + Vercel, délais rapides, accompagnement personnalisé.

Réponds toujours en français. Sois bienveillant, clair et actionnable. Si un client a besoin d'une modification sur son site, suggère-lui de créer une demande dans l'espace "Modifications".`

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Load client context (project info)
  const adminSupabase = createAdminClient()
  const [{ data: profile }, { data: projects }, { data: tickets }] = await Promise.all([
    adminSupabase.from('profiles').select('full_name').eq('id', session.user.id).single(),
    adminSupabase.from('projects').select('name, status, description').eq('client_id', session.user.id).limit(5),
    adminSupabase.from('support_tickets').select('subject, status').eq('client_id', session.user.id).order('created_at', { ascending: false }).limit(3),
  ])

  const contextLines: string[] = []
  if (profile?.full_name) contextLines.push(`Client : ${profile.full_name}`)
  if (projects?.length) {
    contextLines.push('Projets :')
    projects.forEach(p => contextLines.push(`  - ${p.name} (${p.status})${p.description ? ` : ${p.description}` : ''}`))
  }
  if (tickets?.length) {
    contextLines.push('Tickets récents :')
    tickets.forEach(t => contextLines.push(`  - ${t.subject} (${t.status})`))
  }

  const { messages } = await request.json()

  if (!messages?.length) {
    return NextResponse.json({ error: 'Messages requis' }, { status: 400 })
  }

  const geminiKey = process.env.GEMINI_API_KEY
  if (!geminiKey) {
    return NextResponse.json({ error: 'Clé API non configurée' }, { status: 500 })
  }

  const contextBlock = contextLines.length > 0
    ? `\n\n## Contexte du client\n${contextLines.join('\n')}`
    : ''

  const systemWithContext = SYSTEM_PROMPT + contextBlock

  const geminiContents = messages.map((m: { role: string; content: string }) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  if (geminiContents[0]?.role === 'user') {
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
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      }
    )

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text()
      return NextResponse.json({ error: `Erreur API: ${errBody}` }, { status: 502 })
    }

    const data = await geminiRes.json()
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!reply) {
      return NextResponse.json({ error: 'Réponse vide' }, { status: 502 })
    }

    return NextResponse.json({ reply })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: `Erreur: ${message}` }, { status: 500 })
  }
}
