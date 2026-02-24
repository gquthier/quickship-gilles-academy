'use client'

import Link from 'next/link'

export function Logo({
  size = 'md',
  variant = 'dark',
}: {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'dark' | 'light'
}) {
  const sizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  return (
    <Link
      href="/"
      className={`font-display font-extrabold tracking-[-0.04em] ${sizes[size]} flex items-center gap-1`}
    >
      <span className="text-accent">Quick</span>
      <span className={variant === 'light' ? 'text-gray-900' : 'text-white'}>
        Ship
      </span>
    </Link>
  )
}
