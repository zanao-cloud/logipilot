'use client'

import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react'
import type { ComparisonRow } from '@/lib/analysis/compare'

export function CompareTable({
  rows,
  labelA,
  labelB,
}: {
  rows: ComparisonRow[]
  labelA: string
  labelB: string
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">Sem indicadores comuns para comparar.</p>
  }

  return (
    <div className="overflow-x-auto bg-white border border-slate-100 rounded-xl">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="text-left py-3 px-4 font-medium text-slate-700">Indicador</th>
            <th className="text-right py-3 px-4 font-medium text-slate-700">{labelA}</th>
            <th className="text-right py-3 px-4 font-medium text-slate-700">{labelB}</th>
            <th className="text-right py-3 px-4 font-medium text-slate-700">Δ</th>
            <th className="text-right py-3 px-4 font-medium text-slate-700">%</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.name}>
              <td className="py-2.5 px-4 text-slate-700">{r.name}{r.unit ? <span className="text-slate-400"> ({r.unit})</span> : null}</td>
              <td className="py-2.5 px-4 text-right text-slate-700">{r.rawA ?? '—'}</td>
              <td className="py-2.5 px-4 text-right text-slate-700">{r.rawB ?? '—'}</td>
              <td className={`py-2.5 px-4 text-right font-medium ${
                r.direction === 'better' ? 'text-emerald-600' :
                r.direction === 'worse' ? 'text-red-600' : 'text-slate-500'
              }`}>
                {r.delta === null ? '—' : (r.delta > 0 ? `+${r.delta.toFixed(2)}` : r.delta.toFixed(2))}
              </td>
              <td className={`py-2.5 px-4 text-right ${
                r.direction === 'better' ? 'text-emerald-600' :
                r.direction === 'worse' ? 'text-red-600' : 'text-slate-500'
              }`}>
                <span className="inline-flex items-center gap-1 justify-end">
                  {r.direction === 'better' && <TrendingUp className="w-3.5 h-3.5" />}
                  {r.direction === 'worse' && <TrendingDown className="w-3.5 h-3.5" />}
                  {r.direction === 'neutral' && <Minus className="w-3.5 h-3.5" />}
                  {r.deltaPct === null ? '—' : `${r.deltaPct > 0 ? '+' : ''}${r.deltaPct.toFixed(1)}%`}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function CompareSummaryBadge({ better, worse, neutral }: { better: number; worse: number; neutral: number }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded-full">
        <TrendingUp className="w-3.5 h-3.5" /> {better} melhoraram
      </span>
      <ArrowRight className="w-3 h-3 text-slate-300" />
      <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-100 px-2 py-1 rounded-full">
        <TrendingDown className="w-3.5 h-3.5" /> {worse} pioraram
      </span>
      <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-600 border border-slate-100 px-2 py-1 rounded-full">
        <Minus className="w-3.5 h-3.5" /> {neutral} neutros
      </span>
    </div>
  )
}
