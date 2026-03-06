'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { ClientSidebar } from '@/components/layout/ClientSidebar'
import { MobileMenuContext } from '@/context/mobile-menu'
import type { Profile } from '@/types'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // router.push('/login')
        setLoading(false)
        setUser({ full_name: 'Gilles Vaquier', email: 'gilles@example.com', id: '123', role: 'user' } as any)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        setUser(profile as Profile)
        if (profile.role === 'admin') {
          router.push('/admin/dashboard')
          return
        }
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
      <ClientSidebar
        user={user}
        onSignOut={handleSignOut}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <main className="md:ml-[260px] animate-fade-in">
        <MobileMenuContext.Provider value={() => setMobileMenuOpen(true)}>
          {children}
        </MobileMenuContext.Provider>
      </main>
    </div>
  )
}
