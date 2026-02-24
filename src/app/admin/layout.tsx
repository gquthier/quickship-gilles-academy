'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import type { Profile } from '@/types'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        if (profile.role !== 'admin') {
          router.push('/overview')
          return
        }
        setUser(profile as Profile)
      }
      setLoading(false)
    }
    loadUser()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FC]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-body">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      <AdminSidebar user={user} onSignOut={handleSignOut} />
      <main className="ml-[260px] animate-fade-in">
        {children}
      </main>
    </div>
  )
}
