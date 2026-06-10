'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { History, TrendingUp, Search, FileText, Tag, GitCompare, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { FileIcon } from '@/components/ui/file-icon'
import { useToast } from '@/components/ui/toast'
import { RenameDialog, type AnalysisMeta } from '@/components/analysis/rename-dialog'
import type { Analysis, Project, Member } from '@/types'

const statusConfig = {
  completed: { label: 'Concluída', variant: 'success' as const },
  processing: { label: 'Processando', variant: 'warning' as const },
  pending: { label: 'Pendente', variant: 'default' as const },
  error: { label: 'Erro', variant: 'danger' as const },
}

export default function HistoryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [drivers, setDrivers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [driverFilter, setDriverFilter] = useState('')
  const [startFilter, setStartFilter] = useState('')
  const [endFilter, setEndFilter] = useState('')

  const [selected, setSelected] = useState<string[]>([])
  const [editTarget, setEditTarget] = useState<AnalysisMeta | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/analyses').then(r => r.json()).catch(() => []),
      fetch('/api/projects').then(r => r.json()).catch(() => []),
      fetch('/api/organization/team').then(r => r.json()).catch(() => []),
    ]).then(([a, p, t]) => {
      setAnalyses(Array.isArray(a) ? a : [])
      setProjects(Array.isArray(p) ? p : [])
      setDrivers(Array.isArray(t) ? t.filter((m: Member) => m.role === 'motorista') : [])
      setLoading(false)
    })
  }, [])

  const allTags = useMemo(() => {
    const s = new Set<string>()
    for (const a of analyses) for (const t of a.tags ?? []) s.add(t)
    return Array.from(s).sort()
  }, [analyses])

  const filtered = useMemo(() => analyses.filter(a => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false
    if (tagFilter && !(a.tags ?? []).includes(tagFilter)) return false
    if (projectFilter && a.project_id !== projectFilter) return false
    if (driverFilter && a.driver_id !== driverFilter) return false
    if (startFilter && new Date(a.created_at) < new Date(startFilter)) return false
    if (endFilter && new Date(a.created_at) > new Date(endFilter + 'T23:59:59')) return false
    return true
  }), [analyses, search, tagFilter, projectFilter, driverFilter, startFilter, endFilter])

  function toggleSelect(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 2 ? [...prev, id] : [prev[1], id])
  }

  async function deleteAnalysis(a: Analysis) {
    if (!confirm(`Excluir análise "${a.title}"?`)) return
    const res = await fetch(`/api/analyses/${a.id}`, { method: 'DELETE' })
    if (res.ok) {
      setAnalyses(prev => prev.filter(x => x.id !== a.id))
      toast({ variant: 'success', title: 'Análise excluída' })
    } else {
      toast({ variant: 'error', title: 'Erro ao excluir' })
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History className="w-5 h-5 text-slate-600" />
            <h1 className="text-2xl font-bold text-slate-900">Histórico</h1>
          </div>
          <p className="text-slate-500 text-sm">{analyses.length} análise{analyses.length !== 1 ? 's' : ''} no total</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.length === 2 && (
            <Button
              onClick={() => router.push(`/analysis/compare?a=${selected[0]}&b=${selected[1]}`)}
              className="gap-2"
            >
              <GitCompare className="w-4 h-4" /> Comparar
            </Button>
          )}
          <Link href="/analysis/new">
            <Button variant={selected.length === 2 ? 'outline' : 'primary'} className="gap-2">Nova Análise</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="py-4 space-y-3">
          <div className="grid sm:grid-cols-3 md:grid-cols-5 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar título…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none"
              />
            </div>
            <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
              <option value="">Todos os projetos</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={driverFilter} onChange={(e) => setDriverFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
              <option value="">Todos os motoristas</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
            </select>
            <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
              <option value="">Todas as tags</option>
              {allTags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">De</span>
              <input type="date" value={startFilter} onChange={(e) => setStartFilter(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Até</span>
              <input type="date" value={endFilter} onChange={(e) => setEndFilter(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" />
            </div>
          </div>
          {selected.length > 0 && (
            <p className="text-xs text-slate-500">
              {selected.length === 1 ? 'Selecione uma segunda análise para comparar.' : 'Pronto para comparar — clique em "Comparar" no topo.'}
            </p>
          )}
        </CardContent>
      </Card>

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
              {analyses.length === 0 ? 'Nenhuma análise ainda' : 'Nenhuma análise encontrada com os filtros aplicados'}
            </p>
            {analyses.length === 0 && (
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
            const isSelected = selected.includes(analysis.id)

            return (
              <Card key={analysis.id} hover={isClickable} className={isSelected ? 'ring-2 ring-blue-400' : ''}>
                <CardContent className="flex items-center gap-3 py-4">
                  <input
                    type="checkbox"
                    aria-label={`Selecionar para comparação: ${analysis.title}`}
                    disabled={!isClickable}
                    checked={isSelected}
                    onChange={() => toggleSelect(analysis.id)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileIcon type={files[0]?.type || ''} name={files[0]?.name || ''} className="w-5 h-5" />
                  </div>
                  <Link href={isClickable ? `/analysis/${analysis.id}` : '#'} className="flex-1 min-w-0 group">
                    <p className="font-medium text-slate-800 truncate group-hover:underline">{analysis.title}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-slate-400">{formatDate(analysis.created_at)}</span>
                      <span className="text-xs text-slate-300">•</span>
                      <span className="text-xs text-slate-400">
                        {files.length} arquivo{files.length !== 1 ? 's' : ''}
                      </span>
                      {(analysis.tags ?? []).slice(0, 4).map(t => (
                        <span key={t} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <Tag className="w-3 h-3" /> {t}
                        </span>
                      ))}
                    </div>
                  </Link>
                  <Badge variant={config.variant}>{config.label}</Badge>
                  <button
                    onClick={() => setEditTarget({
                      id: analysis.id,
                      title: analysis.title,
                      tags: analysis.tags,
                      project_id: analysis.project_id,
                      driver_id: analysis.driver_id,
                      period_start: analysis.period_start,
                      period_end: analysis.period_end,
                    })}
                    aria-label="Editar"
                    className="p-2 text-slate-500 hover:text-slate-800 rounded"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteAnalysis(analysis)}
                    aria-label="Excluir"
                    className="p-2 text-red-500 hover:text-red-700 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {isClickable && <TrendingUp className="w-4 h-4 text-slate-300 flex-shrink-0" />}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {editTarget && (
        <RenameDialog
          open={!!editTarget}
          onOpenChange={(o) => { if (!o) setEditTarget(null) }}
          analysis={editTarget}
          projects={projects.map(p => ({ id: p.id, label: p.client_name ? `${p.name} · ${p.client_name}` : p.name }))}
          drivers={drivers.map(d => ({ id: d.id, label: d.full_name }))}
          onUpdated={(next) => {
            setAnalyses(prev => prev.map(a => a.id === next.id ? {
              ...a,
              title: next.title,
              tags: next.tags,
              project_id: next.project_id,
              driver_id: next.driver_id,
              period_start: next.period_start,
              period_end: next.period_end,
            } : a))
          }}
        />
      )}
    </div>
  )
}
