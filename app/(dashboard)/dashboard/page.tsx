'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  PlusCircle, FileText, Clock, CheckCircle, AlertCircle,
  TrendingUp, BarChart3, Brain, Users, Truck, Shield, ArrowRight,
  KeyRound, UserPlus, FileSpreadsheet, Image as ImageIcon,
  Camera, LineChart, Type,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { FileIcon } from '@/components/ui/file-icon'
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
        .then(async r => r.ok ? r.json() : null)
        .then(data => setTeam(Array.isArray(data) ? data : []))
        .catch(() => {})
    }
  }, [isGestor])

  const completed  = analyses.filter(a => a.status === 'completed').length
  const processing = analyses.filter(a => a.status === 'processing').length
  const errors     = analyses.filter(a => a.status === 'error').length
  const operadores = team.filter(m => m.role === 'operador').length
  const motoristas = team.filter(m => m.role === 'motorista').length
  const gestores   = team.filter(m => m.role === 'gestor').length

  return (
    <div className="min-h-screen bg-[#060d1a] p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-semibold text-sky-400 uppercase tracking-widest mb-1">Central de análise</p>
          <h1 className="text-2xl font-bold text-white">
            {profile?.full_name?.split(' ')[0]
              ? `Olá, ${profile.full_name.split(' ')[0]}`
              : 'Dashboard'}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {profile?.organizations?.name || 'Gestão operacional'}
          </p>
        </div>
        <Link href="/analysis/new">
          <Button size="lg" className="gap-2">
            <PlusCircle className="w-4 h-4" />
            Nova Análise
          </Button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total',       value: analyses.length, Icon: FileText,    color: '#3b82f6', glow: 'rgba(59,130,246,0.18)' },
          { label: 'Concluídas',  value: completed,       Icon: CheckCircle, color: '#10b981', glow: 'rgba(16,185,129,0.18)' },
          { label: 'Processando', value: processing,      Icon: Clock,       color: '#f59e0b', glow: 'rgba(245,158,11,0.18)' },
          { label: 'Com Erros',   value: errors,          Icon: AlertCircle, color: '#ef4444', glow: 'rgba(239,68,68,0.18)' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-5 flex items-center gap-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${s.color}18`, boxShadow: `0 0 16px ${s.glow}`, border: `1px solid ${s.color}28` }}>
              <s.Icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Team management (gestors only — always visible so access creation is discoverable) */}
      {isGestor && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-white">Equipe e acessos</h2>
              <p className="text-xs text-slate-500 mt-0.5">Crie logins de colaboradores e motoristas da sua empresa</p>
            </div>
            <Link href="/dashboard/acessos"
              className="flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-xl transition-all"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', color: 'white', boxShadow: '0 0 18px rgba(14,165,233,0.35)' }}>
              <UserPlus className="w-4 h-4" />
              Criar acesso
            </Link>
          </div>

          {team.length === 0 ? (
            // Empty state — prominent CTA for first-time gestors
            <div className="rounded-2xl p-6 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(29,78,216,0.12), rgba(14,165,233,0.06))', border: '1px solid rgba(56,189,248,0.18)' }}>
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(14,165,233,0.12) 0%, transparent 65%)' }} />
              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', boxShadow: '0 0 24px rgba(14,165,233,0.4)' }}>
                    <KeyRound className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Você ainda não tem colaboradores ou motoristas cadastrados</p>
                    <p className="text-sm text-slate-400 mt-0.5">Crie acessos para sua equipe usar os portais Operador e Motorista</p>
                  </div>
                </div>
                <Link href="/dashboard/acessos">
                  <Button className="gap-2 whitespace-nowrap">
                    <UserPlus className="w-4 h-4" />
                    Criar primeiro acesso
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Gestores',   value: gestores,   Icon: Shield, color: '#3b82f6', href: '/dashboard/acessos' },
                { label: 'Operadores', value: operadores, Icon: Users,  color: '#f59e0b', href: '/dashboard/acessos' },
                { label: 'Motoristas', value: motoristas, Icon: Truck,  color: '#38bdf8', href: '/dashboard/motoristas' },
              ].map(item => (
                <Link key={item.label} href={item.href}>
                  <div className="rounded-2xl p-5 flex items-center gap-3 transition-all cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${item.color}14`, border: `1px solid ${item.color}28`, boxShadow: `0 0 12px ${item.color}20` }}>
                      <item.Icon className="w-4 h-4" style={{ color: item.color }} />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">{item.value}</p>
                      <p className="text-xs text-slate-500">{item.label}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {analyses.length === 0 && !loading && (
        <div className="mb-8 rounded-2xl p-8 overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #0a1628, #0f2060, #0a1628)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(14,165,233,0.08) 0%, transparent 65%)' }} />
          <div className="relative flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 text-sky-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-4"
                style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)' }}>
                <Brain className="w-3 h-3" />
                Comece agora
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Sua primeira análise está a um upload de distância
              </h2>
              <p className="text-slate-400 mb-6">
                Envie Excel, CSV, PDF, imagens ou prints — a IA gera diagnóstico completo com
                resumo executivo, indicadores, gargalos, riscos e plano de ação.
              </p>
              <Link href="/analysis/new">
                <Button size="lg" className="gap-2">
                  <PlusCircle className="w-4 h-4" />
                  Iniciar primeira análise
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3 flex-shrink-0">
              {[
                { Icon: FileSpreadsheet, color: '#10b981', label: 'Excel / CSV' },
                { Icon: FileText,        color: '#ef4444', label: 'PDFs' },
                { Icon: ImageIcon,       color: '#38bdf8', label: 'Imagens' },
                { Icon: Camera,          color: '#a78bfa', label: 'Prints' },
                { Icon: LineChart,       color: '#f59e0b', label: 'Power BI' },
                { Icon: Type,            color: '#94a3b8', label: 'Textos' },
              ].map(item => (
                <div key={item.label} className="rounded-xl p-3 text-center"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <item.Icon className="w-5 h-5 mx-auto mb-1.5" style={{ color: item.color }} />
                  <p className="text-xs text-slate-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent analyses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Análises recentes</h2>
          {analyses.length > 5 && (
            <Link href="/history" className="text-sm text-sky-400 hover:text-sky-300 transition-colors">Ver todas</Link>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl h-20 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        ) : analyses.length === 0 ? (
          <div className="rounded-2xl py-12 text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <BarChart3 className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500">Nenhuma análise ainda. Crie sua primeira!</p>
          </div>
        ) : (
          <div className="space-y-2">
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
    error:      { label: 'Erro',        variant: 'danger'  as const },
  }
  const config = statusConfig[analysis.status]
  const isClickable = analysis.status === 'completed'
  const files = (analysis.files as { name: string; type: string }[]) || []

  const content = (
    <div className="flex items-center gap-4 px-5 py-4 rounded-xl transition-all"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      onMouseEnter={e => { if (isClickable) e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
      onMouseLeave={e => { if (isClickable) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <FileIcon type={files[0]?.type || ''} name={files[0]?.name || ''} className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{analysis.title}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-slate-500">{formatDate(analysis.created_at)}</span>
          <span className="text-xs text-slate-700">•</span>
          <span className="text-xs text-slate-500">{files.length} arquivo{files.length !== 1 ? 's' : ''}</span>
          {analysis.status === 'error' && analysis.error_message && (
            <>
              <span className="text-xs text-slate-700">•</span>
              <span className="text-xs text-red-400 truncate max-w-xs">{analysis.error_message}</span>
            </>
          )}
        </div>
      </div>
      <Badge variant={config.variant}>{config.label}</Badge>
      {isClickable && <TrendingUp className="w-4 h-4 text-slate-600 flex-shrink-0" />}
    </div>
  )

  return isClickable ? <Link href={`/analysis/${analysis.id}`}>{content}</Link> : content
}
