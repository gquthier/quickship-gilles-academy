'use client'

import { createContext, useContext } from 'react'

export const MobileMenuContext = createContext<(() => void) | undefined>(undefined)

export function useMobileMenu() {
  return useContext(MobileMenuContext)
}
