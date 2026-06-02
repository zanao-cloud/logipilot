'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PlusCircle, Search, TrendingUp, FileText, Truck, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { FileIcon } from '@/components/ui/file-icon'
import type { Analysis, Member } from '@/types'

const statusConfig = {
  completed:  { label: 'Concluída',   variant: 'success'  as const },
  processing: { label: 'Processando', variant: 'warning'  as const },
  pending:    { label: 'Pendente',    variant: 'default'  as const },
  error:      { label: 'Erro',        variant: 'danger'   as const },
}

function matchesDriver(analysis: Analysis, name: string) {
  const t = analysis.title?.toLowerCase() ?? ''
  const firstName = name.split(' ')[0].toLowerCase()
  return t.includes(name.toLowerCase()) || t.includes(firstName)
}

export default function AnalisesGestaoPage() {
  const [analyses, setAnalyses]   = useState<Analysis[]>([])
  const [motoristas, setMotoristas] = useState<Member[]>([])
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/analyses').then(r => r.json()),
      fetch('/api/organization/team').then(r => r.json()),
    ]).then(([a, t]) => {
      setAnalyses(a || [])
      setMotoristas((t || []).filter((m: Member) => m.role === 'motorista'))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = analyses.filter(a =>
    !search || a.title?.toLowerCase().includes(search.toLowerCase())
  )

  const assignedIds = new Set<string>()
  const groups = motoristas.map(m => {
    const related = filtered.filter(a => matchesDriver(a, m.full_name))
    related.forEach(a => assignedIds.add(a.id))
    return { motorista: m, analyses: related }
  })
  const unassigned = filtered.filter(a => !assignedIds.has(a.id))

  const total     = analyses.length
  const completed = analyses.filter(a => a.status === 'completed').length

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Análises da equipe</h1>
          <p className="text-slate-500 text-sm mt-1">
            {total} análise{total !== 1 ? 's' : ''} · {completed} concluída{completed !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/analysis/new">
          <Button className="gap-2">
            <PlusCircle className="w-4 h-4" />
            Nova análise
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-8 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar análises..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl h-32 animate-pulse border border-slate-100" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Per-motorista groups */}
          {groups.map(({ motorista, analyses: list }) => (
            <Card key={motorista.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <Truck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <Link
                        href={`/dashboard/motoristas/${motorista.id}`}
                        className="font-semibold text-slate-800 hover:text-[#1E3A5F] text-sm"
                      >
                        {motorista.full_name}
                      </Link>
                      {motorista.vehicle_plate && (
                        <p className="text-xs text-slate-400">{motorista.vehicle_plate}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                      {list.length} análise{list.length !== 1 ? 's' : ''}
                    </span>
                    <Link
                      href={`/analysis/new?title=${encodeURIComponent(`Análise — ${motorista.full_name}`)}&context=${encodeURIComponent(`Dados de desempenho do motorista ${motorista.full_name}${motorista.vehicle_plate ? `, placa ${motorista.vehicle_plate}` : ''}.`)}`}
                    >
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                        <PlusCircle className="w-3.5 h-3.5" />
                        Analisar
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>

              {list.length === 0 ? (
                <CardContent className="pt-0">
                  <p className="text-xs text-slate-400 italic">Nenhuma análise para este motorista ainda.</p>
                </CardContent>
              ) : (
                <CardContent className="pt-0 space-y-2">
                  {list.map(a => <AnalysisRow key={a.id} analysis={a} />)}
                </CardContent>
              )}
            </Card>
          ))}

          {/* Unassigned analyses */}
          {unassigned.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">Outras análises</p>
                    <p className="text-xs text-slate-400">{unassigned.length} análise{unassigned.length !== 1 ? 's' : ''} sem motorista associado</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {unassigned.map(a => <AnalysisRow key={a.id} analysis={a} />)}
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {groups.length === 0 && unassigned.length === 0 && (
            <Card>
              <CardContent className="py-16 text-center">
                <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 mb-2">
                  {search ? 'Nenhuma análise encontrada' : 'Nenhuma análise ainda'}
                </p>
                {!search && (
                  <Link href="/analysis/new">
                    <Button variant="outline" size="sm">Criar primeira análise</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

function AnalysisRow({ analysis }: { analysis: Analysis }) {
  const config  = statusConfig[analysis.status]
  const files   = (analysis.files as { name: string; type: string }[]) || []
  const isClick = analysis.status === 'completed'

  const row = (
    <div className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${isClick ? 'hover:bg-slate-50 cursor-pointer' : ''}`}>
      <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <FileIcon type={files[0]?.type || ''} name={files[0]?.name || ''} className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{analysis.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-400">{formatDate(analysis.created_at)}</span>
          <span className="text-xs text-slate-300">·</span>
          <span className="text-xs text-slate-400">{files.length} arquivo{files.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <Badge variant={config.variant}>{config.label}</Badge>
      {isClick && <TrendingUp className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />}
    </div>
  )

  return isClick ? <Link href={`/analysis/${analysis.id}`}>{row}</Link> : row
}
