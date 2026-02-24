import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const teamId = searchParams.get('teamId')

  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 })
  }

  const token = process.env.VERCEL_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'Vercel token not configured' }, { status: 500 })
  }

  try {
    const params = new URLSearchParams({
      projectId,
      limit: '20',
      ...(teamId ? { teamId } : {}),
    })

    const res = await fetch(`https://api.vercel.com/v6/deployments?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60 },
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: 'Vercel API error', details: err }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch deployments' }, { status: 500 })
  }
}
