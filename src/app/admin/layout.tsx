'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { AdminMobileMenuContext } from '@/context/admin-mobile-menu'
import type { Profile } from '@/types'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] border-surface-border border-t-accent rounded-full animate-spin" />
          <p className="text-sm text-text-muted font-body">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      <AdminSidebar
        user={user}
        onSignOut={handleSignOut}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <main className="md:ml-[260px] animate-fade-in">
        <AdminMobileMenuContext.Provider value={() => setMobileMenuOpen(true)}>
          {children}
        </AdminMobileMenuContext.Provider>
      </main>
    </div>
  )
}
