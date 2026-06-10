'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Globe, Check, ChevronDown } from 'lucide-react'

const LOCALES = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
] as const

export function LocaleSwitcher() {
  const router = useRouter()
  const locale = useLocale()
  const [pending, startTransition] = useTransition()

  function change(next: string) {
    startTransition(async () => {
      await fetch('/api/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: next }),
      })
      router.refresh()
    })
  }

  const current = LOCALES.find(l => l.code === locale) ?? LOCALES[0]

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label="Trocar idioma"
        disabled={pending}
        className="inline-flex items-center gap-1 px-2.5 h-9 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-xs text-slate-700"
      >
        <Globe className="w-3.5 h-3.5" aria-hidden="true" />
        {current.code.toUpperCase()}
        <ChevronDown className="w-3 h-3" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-[160px] rounded-md bg-white border border-slate-200 shadow-lg p-1"
        >
          {LOCALES.map((l) => (
            <DropdownMenu.Item
              key={l.code}
              onSelect={() => change(l.code)}
              className="flex items-center gap-2 px-2.5 py-2 text-sm rounded cursor-pointer outline-none data-[highlighted]:bg-slate-100 text-slate-700"
            >
              {l.code === locale ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <span className="w-3.5 h-3.5" />}
              {l.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
