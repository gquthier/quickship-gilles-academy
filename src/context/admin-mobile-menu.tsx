'use client'

import { createContext, useContext } from 'react'

export const AdminMobileMenuContext = createContext<(() => void) | undefined>(undefined)

export function useAdminMobileMenu() {
  return useContext(AdminMobileMenuContext)
}
