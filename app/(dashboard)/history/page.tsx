'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { History, TrendingUp, Search, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { FileIcon } from '@/components/ui/file-icon'
import type { Analysis } from '@/types'

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/analyses')
      .then(r => r.json())
      .then(data => { setAnalyses(data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = analyses.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase())
  )

  const statusConfig = {
    completed: { label: 'Concluída', variant: 'success' as const },
    processing: { label: 'Processando', variant: 'warning' as const },
    pending: { label: 'Pendente', variant: 'default' as const },
    error: { label: 'Erro', variant: 'danger' as const },
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History className="w-5 h-5 text-slate-600" />
            <h1 className="text-2xl font-bold text-slate-900">Histórico</h1>
          </div>
          <p className="text-slate-500 text-sm">{analyses.length} análise{analyses.length !== 1 ? 's' : ''} no total</p>
        </div>
        <Link href="/analysis/new">
          <Button className="gap-2">Nova Análise</Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar análises..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white rounded-xl h-20 animate-pulse border border-slate-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400">
              {search ? 'Nenhuma análise encontrada' : 'Nenhuma análise ainda'}
            </p>
            {!search && (
              <Link href="/analysis/new" className="text-[#1E3A5F] text-sm hover:underline mt-2 inline-block">
                Criar primeira análise
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((analysis) => {
            const config = statusConfig[analysis.status]
            const files = (analysis.files as { name: string; type: string }[]) || []
            const isClickable = analysis.status === 'completed'

            const card = (
              <Card hover={isClickable} key={analysis.id}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileIcon type={files[0]?.type || ''} name={files[0]?.name || ''} className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{analysis.title}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-slate-400">{formatDate(analysis.created_at)}</span>
                      <span className="text-xs text-slate-300">•</span>
                      <span className="text-xs text-slate-400">
                        {files.length} arquivo{files.length !== 1 ? 's' : ''}
                      </span>
                      {files.slice(0, 3).map(f => (
                        <span key={f.name} className="text-xs text-slate-400 inline-flex items-center gap-1">
                          <FileIcon type={f.type} name={f.name} className="w-3 h-3" />
                          {f.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Badge variant={config.variant}>{config.label}</Badge>
                  {isClickable && <TrendingUp className="w-4 h-4 text-slate-300 flex-shrink-0" />}
                </CardContent>
              </Card>
            )

            return isClickable ? (
              <Link key={analysis.id} href={`/analysis/${analysis.id}`}>{card}</Link>
            ) : card
          })}
        </div>
      )}
    </div>
  )
}
