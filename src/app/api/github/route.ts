import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const org = searchParams.get('org')
  const repo = searchParams.get('repo')
  const endpoint = searchParams.get('endpoint') || 'commits'

  if (!repo) {
    return NextResponse.json({ error: 'repo required' }, { status: 400 })
  }

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 })
  }

  try {
    const owner = org || ''
    const url = `https://api.github.com/repos/${owner}/${repo}/${endpoint}?per_page=20`

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
      next: { revalidate: 60 },
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: 'GitHub API error', details: err }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch from GitHub' }, { status: 500 })
  }
}
