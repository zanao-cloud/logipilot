'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  FileText,
  Brain,
  AlertTriangle,
  Target,
  MessageSquare,
  Download,
  Sparkles,
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
  const base = `/analysis/${analysisId}`

  return (
    <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
      {title && (
        <div className="px-6 pt-4 pb-0">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Análise</p>
          <h1 className="text-base font-semibold text-slate-800 mt-0.5 truncate max-w-2xl">{title}</h1>
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
