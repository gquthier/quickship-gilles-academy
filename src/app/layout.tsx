import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'QuickShip — Espace Client',
  description: 'Gérez vos projets web, suivez les déploiements et contactez notre équipe.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
