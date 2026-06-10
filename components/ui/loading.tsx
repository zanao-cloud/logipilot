'use client'

import { useEffect, useState } from 'react'
import { Brain, Check } from 'lucide-react'
import * as Progress from '@radix-ui/react-progress'
import { cn as cnUtil } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const cn = cnUtil

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export function PageLoader({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-[#1E3A5F] animate-spin" />
      {message && <p className="text-slate-500 text-sm">{message}</p>}
    </div>
  )
}

type StageId = 'upload' | 'parse' | 'analyze' | 'save'

const STAGES: Array<{ id: StageId; label: string; pct: number }> = [
  { id: 'upload', label: 'Recebendo arquivos', pct: 10 },
  { id: 'parse', label: 'Lendo conteúdo', pct: 35 },
  { id: 'analyze', label: 'Analisando com IA', pct: 70 },
  { id: 'save', label: 'Salvando resultados', pct: 100 },
]

function formatEta(seconds: number): string {
  if (seconds <= 0 || !isFinite(seconds)) return '—'
  if (seconds < 60) return `${Math.round(seconds)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}m ${s}s`
}

export function AnalysisProcessingLoader({
  stage,
  analysisId,
}: {
  stage: StageId
  analysisId?: string | null
}) {
  const [pct, setPct] = useState<number>(0)
  const [serverStage, setServerStage] = useState<StageId | null>(null)
  const [times, setTimes] = useState<{ start: number; now: number } | null>(null)

  useEffect(() => {
    const tick = setInterval(() => {
      setTimes((prev) => {
        const now = Date.now()
        return prev ? { ...prev, now } : { start: now, now }
      })
    }, 1000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    if (!analysisId) return
    const supabase = createClient()
    let cancelled = false

    const poll = async () => {
      const { data } = await supabase
        .from('analyses')
        .select('progress_pct, progress_stage, status')
        .eq('id', analysisId)
        .maybeSingle()
      if (cancelled || !data) return
      if (typeof data.progress_pct === 'number') setPct(data.progress_pct)
      if (data.progress_stage) setServerStage(data.progress_stage as StageId)
      if (data.status === 'completed' || data.status === 'error') {
        clearInterval(timer)
      }
    }
    poll()
    const timer = setInterval(poll, 1500)
    return () => { cancelled = true; clearInterval(timer) }
  }, [analysisId])

  const effectiveStage: StageId = serverStage ?? stage
  const effectivePct = pct || STAGES.find(s => s.id === effectiveStage)?.pct || 5
  const currentIdx = STAGES.findIndex(s => s.id === effectiveStage)
  const elapsedSeconds = times ? (times.now - times.start) / 1000 : 0
  const etaSeconds = times && effectivePct > 5 ? (elapsedSeconds / effectivePct) * (100 - effectivePct) : NaN

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
        <div className="absolute inset-0 rounded-full border-4 border-t-[#1E3A5F] border-r-emerald-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Brain className="w-7 h-7 text-[#1E3A5F]" />
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-800">Analisando seus dados</h3>
        <p className="text-slate-500 text-sm mt-1">A IA está processando todas as informações...</p>
      </div>

      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span>{effectivePct}%</span>
          <span aria-live="polite">{isFinite(etaSeconds) ? `~${formatEta(etaSeconds)} restantes` : 'estimando...'}</span>
        </div>
        <Progress.Root
          value={effectivePct}
          max={100}
          className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100"
          aria-label={`Progresso da análise: ${effectivePct}%`}
        >
          <Progress.Indicator
            className="h-full bg-gradient-to-r from-[#1E3A5F] to-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${effectivePct}%` }}
          />
        </Progress.Root>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {STAGES.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3">
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
              i < currentIdx ? 'bg-emerald-500 text-white' :
              i === currentIdx ? 'bg-[#1E3A5F] text-white animate-pulse' :
              'bg-slate-100 text-slate-400'
            )}>
              {i < currentIdx ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={cn(
              'text-sm',
              i <= currentIdx ? 'text-slate-800 font-medium' : 'text-slate-400'
            )}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
