'use client'

import Link from 'next/link'

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  return (
    <Link href="/" className={`font-display font-extrabold tracking-tight ${sizes[size]}`}>
      <span className="text-purple">Quick</span>
      <span className="text-slate-900">Ship</span>
    </Link>
  )
}
