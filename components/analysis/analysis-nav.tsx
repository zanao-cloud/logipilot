'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import {
  FileText,
  Brain,
  AlertTriangle,
  Target,
  MessageSquare,
  Download,
  Sparkles,
  Pencil,
  Check,
  X,
} from 'lucide-react'

const tabs = [
  { href: '', icon: FileText, label: 'Resumo' },
  { href: '/diagnosis', icon: Brain, label: 'Diagnóstico IA' },
  { href: '/inconsistencies', icon: AlertTriangle, label: 'Inconsistências' },
  { href: '/action-plan', icon: Target, label: 'Plano de Ação' },
  { href: '/forecast', icon: Sparkles, label: 'Previsão' },
  { href: '/chat', icon: MessageSquare, label: 'Chat' },
  { href: '/export', icon: Download, label: 'Exportar' },
]

export function AnalysisNav({ analysisId, title }: { analysisId: string; title?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const base = `/analysis/${analysisId}`

  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(title ?? '')
  const [saving, setSaving] = useState(false)

  async function saveTitle() {
    const trimmed = value.trim()
    if (!trimmed) {
      toast({ variant: 'warning', title: 'O título não pode ficar vazio' })
      setValue(title ?? '')
      setEditing(false)
      return
    }
    if (trimmed === title) { setEditing(false); return }

    setSaving(true)
    try {
      const res = await fetch(`/api/analyses/${analysisId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      })
      if (!res.ok) throw new Error()
      setEditing(false)
      router.refresh()
    } catch {
      toast({ variant: 'error', title: 'Não foi possível renomear a análise' })
      setValue(title ?? '')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
      {title && (
        <div className="px-6 pt-4 pb-0">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Análise</p>
          {editing ? (
            <div className="flex items-center gap-1.5 mt-0.5 max-w-2xl">
              <input
                autoFocus
                value={value}
                disabled={saving}
                onChange={(e) => setValue(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveTitle()
                  if (e.key === 'Escape') { setValue(title ?? ''); setEditing(false) }
                }}
                className="text-base font-semibold text-slate-800 border-b border-[#1E3A5F] outline-none bg-transparent flex-1"
              />
              <Check className="w-4 h-4 text-emerald-600" />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setValue(title ?? ''); setEditing(false) }}
                disabled={saving}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mt-0.5 group">
              <h1 className="text-base font-semibold text-slate-800 truncate max-w-2xl">{title}</h1>
              <button
                type="button"
                onClick={() => { setValue(title ?? ''); setEditing(true) }}
                className="text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Renomear análise"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
      <div className="flex items-center px-6 overflow-x-auto gap-0">
        {tabs.map((tab) => {
          const href = `${base}${tab.href}`
          const active = tab.href === '' ? pathname === base : pathname.startsWith(href)
          return (
            <Link
              key={tab.href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                active
                  ? 'border-[#1E3A5F] text-[#1E3A5F]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}