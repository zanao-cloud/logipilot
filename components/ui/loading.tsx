import { cn as cnUtil } from '@/lib/utils'
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

export function AnalysisProcessingLoader({ stage }: { stage: string }) {
  const stages = [
    { id: 'upload', label: 'Recebendo arquivos' },
    { id: 'parse', label: 'Lendo conteúdo' },
    { id: 'analyze', label: 'Analisando com IA' },
    { id: 'save', label: 'Salvando resultados' },
  ]

  const currentIdx = stages.findIndex(s => s.id === stage)

  return (
    <div className="flex flex-col items-center gap-8 py-12">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
        <div className="absolute inset-0 rounded-full border-4 border-t-[#1E3A5F] border-r-emerald-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">🤖</span>
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-800">Analisando seus dados</h3>
        <p className="text-slate-500 text-sm mt-1">A IA está processando todas as informações...</p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {stages.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3">
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
              i < currentIdx ? 'bg-emerald-500 text-white' :
              i === currentIdx ? 'bg-[#1E3A5F] text-white animate-pulse' :
              'bg-slate-100 text-slate-400'
            )}>
              {i < currentIdx ? '✓' : i + 1}
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

