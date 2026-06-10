'use client'

import { Check, X } from 'lucide-react'
import { checkPassword, MIN_PASSWORD_LENGTH } from '@/lib/auth/password'

export function PasswordStrength({ password }: { password: string }) {
  const c = checkPassword(password)
  const items = [
    { ok: c.minLength, label: `Mínimo ${MIN_PASSWORD_LENGTH} caracteres` },
    { ok: c.hasUppercase, label: 'Letra maiúscula' },
    { ok: c.hasLowercase, label: 'Letra minúscula' },
    { ok: c.hasNumber, label: 'Número' },
    { ok: c.hasSpecial, label: 'Caractere especial (!@#$…)' },
  ]
  if (password.length === 0) return null
  return (
    <ul className="mt-2 space-y-1 text-xs">
      {items.map(({ ok, label }) => (
        <li key={label} className={ok ? 'text-emerald-600 flex items-center gap-1.5' : 'text-slate-400 flex items-center gap-1.5'}>
          {ok ? <Check className="w-3 h-3" aria-hidden="true" /> : <X className="w-3 h-3" aria-hidden="true" />}
          {label}
        </li>
      ))}
    </ul>
  )
}
