import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
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

    const { error } = await adminClient.from('onboarding_responses').insert({
      questionnaire_type: questionnaire_type || 'website',
      submitted_at: submitted_at || new Date().toISOString(),
      responses,
    })

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500, headers: CORS_HEADERS }
      )
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
