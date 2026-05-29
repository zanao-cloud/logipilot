'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  PlusCircle, FileText, Clock, CheckCircle, AlertCircle,
  TrendingUp, BarChart3, Brain, Users, Truck, Shield,
  ArrowRight, UserCog,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, getFileIcon } from '@/lib/utils'
import { useProfile } from '@/lib/hooks/use-profile'
import type { Analysis, Member } from '@/types'

export default function DashboardPage() {
  const { profile } = useProfile()
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [team, setTeam] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  const isGestor = profile?.role === 'gestor'

  useEffect(() => {
    fetch('/api/analyses')
      .then(r => r.json())
      .then(data => { setAnalyses(data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (isGestor) {
      fetch('/api/organization/team')
        .then(r => r.json())
        .then(data => setTeam(data || []))
        .catch(() => {})
    }
  }, [isGestor])

  const completed = analyses.filter(a => a.status === 'completed').length
  const processing = analyses.filter(a => a.status === 'processing').length
  const errors = analyses.filter(a => a.status === 'error').length

  const operadores  = team.filter(m => m.role === 'operador').length
  const motoristas  = team.filter(m => m.role === 'motorista').length
  const gestores    = team.filter(m => m.role === 'gestor').length

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Central de análise operacional</p>
        </div>
        <Link href="/analysis/new">
          <Button size="lg" className="gap-2">
            <PlusCircle className="w-4 h-4" />
            Nova Análise
          </Button>
        </Link>
      </div>

      {/* Análises stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total de Análises', value: analyses.length, icon: FileText,     color: 'text-blue-600 bg-blue-50' },
          { label: 'Concluídas',        value: completed,       icon: CheckCircle,  color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Processando',       value: processing,      icon: Clock,        color: 'text-amber-600 bg-amber-50' },
          { label: 'Com Erros',         value: errors,          icon: AlertCircle,  color: 'text-red-600 bg-red-50' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center flex-shrink-0`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Equipe resumo (gestores) */}
      {isGestor && team.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-800">Equipe</h2>
            <Link href="/dashboard/equipe" className="flex items-center gap-1 text-sm text-[#1E3A5F] hover:underline font-medium">
              Gerenciar <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Gestores',   value: gestores,   icon: Shield, color: 'text-blue-600 bg-blue-50',     href: '/dashboard/equipe' },
              { label: 'Operadores', value: operadores, icon: Users,  color: 'text-amber-600 bg-amber-50',   href: '/dashboard/equipe' },
              { label: 'Motoristas', value: motoristas, icon: Truck,  color: 'text-emerald-600 bg-emerald-50', href: '/dashboard/motoristas' },
            ].map(item => (
              <Link key={item.label} href={item.href}>
                <Card hover>
                  <CardContent className="flex items-center gap-3 py-4">
                    <div className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-slate-800">{item.value}</p>
                      <p className="text-xs text-slate-500">{item.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {analyses.length === 0 && !loading && (
        <div className="mb-8 bg-gradient-to-br from-[#0F1B2D] to-[#1E3A5F] rounded-2xl p-8 text-white">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-white/10 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                <Brain className="w-3 h-3" />
                Comece agora
              </div>
              <h2 className="text-2xl font-bold mb-3">Sua primeira análise está a um upload de distância</h2>
              <p className="text-slate-300 mb-6">
                Envie Excel, CSV, PDF, imagens ou prints — a IA gera diagnóstico completo com
                resumo executivo, indicadores, gargalos, riscos e plano de ação.
              </p>
              <Link href="/analysis/new">
                <Button variant="secondary" size="lg">Iniciar primeira análise</Button>
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: '📊', label: 'Excel / CSV' },
                { icon: '📄', label: 'PDFs' },
                { icon: '🖼️', label: 'Imagens' },
                { icon: '📸', label: 'Prints' },
                { icon: '📈', label: 'Power BI' },
                { icon: '📝', label: 'Textos' },
              ].map(f => (
                <div key={f.label} className="bg-white/10 rounded-xl p-3 text-center">
                  <div className="text-2xl mb-1">{f.icon}</div>
                  <p className="text-xs text-slate-300">{f.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent analyses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800">Análises recentes</h2>
          {analyses.length > 5 && (
            <Link href="/history" className="text-sm text-[#1E3A5F] hover:underline">Ver todas</Link>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl h-20 animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : analyses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400">Nenhuma análise ainda. Crie sua primeira!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {analyses.slice(0, 10).map(analysis => (
              <AnalysisCard key={analysis.id} analysis={analysis} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AnalysisCard({ analysis }: { analysis: Analysis }) {
  const statusConfig = {
    completed:  { label: 'Concluída',   variant: 'success' as const },
    processing: { label: 'Processando', variant: 'warning' as const },
    pending:    { label: 'Pendente',    variant: 'default' as const },
    error:      { label: 'Erro',        variant: 'danger' as const },
  }

  const config = statusConfig[analysis.status]
  const isClickable = analysis.status === 'completed'
  const files = (analysis.files as { name: string; type: string }[]) || []

  const content = (
    <Card hover={isClickable}>
      <CardContent className="flex items-center gap-4 py-4">
        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
          {files[0] ? getFileIcon(files[0].type, files[0].name) : '📁'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-800 truncate">{analysis.title}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-slate-400">{formatDate(analysis.created_at)}</span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-400">{files.length} arquivo{files.length !== 1 ? 's' : ''}</span>
            {analysis.status === 'error' && analysis.error_message && (
              <>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-red-500 truncate max-w-xs">{analysis.error_message}</span>
              </>
            )}
          </div>
        </div>
        <Badge variant={config.variant}>{config.label}</Badge>
        {isClickable && <TrendingUp className="w-4 h-4 text-slate-300 flex-shrink-0" />}
      </CardContent>
    </Card>
  )

  return isClickable ? <Link href={`/analysis/${analysis.id}`}>{content}</Link> : content
}
