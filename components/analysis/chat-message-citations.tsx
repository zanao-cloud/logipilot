'use client'

import { BarChart3, AlertTriangle, ClipboardList, Lightbulb, FileText } from 'lucide-react'
import type { ChatCitation } from '@/lib/ai/analyze'

const CITATION_ICONS = {
  indicator: BarChart3,
  inconsistency: AlertTriangle,
  action: ClipboardList,
  opportunity: Lightbulb,
  section: FileText,
} as const

const CITATION_COLORS = {
  indicator: 'bg-blue-50 border-blue-100 text-blue-700',
  inconsistency: 'bg-amber-50 border-amber-100 text-amber-700',
  action: 'bg-emerald-50 border-emerald-100 text-emerald-700',
  opportunity: 'bg-purple-50 border-purple-100 text-purple-700',
  section: 'bg-slate-50 border-slate-100 text-slate-700',
} as const

export function ChatMessageCitations({ citations }: { citations?: ChatCitation[] }) {
  if (!citations || citations.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {citations.slice(0, 8).map((c, i) => {
        const Icon = CITATION_ICONS[c.type] ?? FileText
        const color = CITATION_COLORS[c.type] ?? CITATION_COLORS.section
        return (
          <span
            key={`${c.type}-${c.ref}-${i}`}
            className={`inline-flex items-center gap-1 text-xs ${color} border px-2 py-0.5 rounded-full`}
            title={`${c.type}: ${c.ref}`}
          >
            <Icon className="w-3 h-3" aria-hidden="true" />
            {c.label || c.ref}
          </span>
        )
      })}
    </div>
  )
}
