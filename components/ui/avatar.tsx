'use client'

import { cn } from '@/lib/utils'

const ROLE_COLOR: Record<string, string> = {
  gestor:    'bg-blue-500',
  operador:  'bg-amber-500',
  motorista: 'bg-emerald-500',
}

const SIZE_CLASS: Record<string, string> = {
  sm: 'w-8 h-8 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-20 h-20 text-xl',
}

function getInitials(name: string) {
  const parts = (name || '').trim().split(/\s+/)
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (parts[0] || '?').slice(0, 2).toUpperCase()
}

interface AvatarProps {
  src?: string | null
  name?: string
  role?: string
  size?: keyof typeof SIZE_CLASS
  className?: string
}

export function Avatar({ src, name = '', role, size = 'md', className }: AvatarProps) {
  const base = cn(
    'rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold shadow-md overflow-hidden',
    SIZE_CLASS[size],
    !src && (ROLE_COLOR[role || ''] || 'bg-slate-500'),
    className,
  )

  if (src) {
    return (
      <div className={base}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={name || 'Avatar'} className="w-full h-full object-cover" />
      </div>
    )
  }

  return <div className={base}>{getInitials(name)}</div>
}
