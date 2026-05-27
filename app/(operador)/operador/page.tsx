'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PlusCircle, BarChart3, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, getFileIcon } from '@/lib/utils'
import { useProfile } from '@/lib/hooks/use-profile'
import type { Analysis } from '@/types'

export default function OperadorPage() {
  const { profile } = useProfile()
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analyses').then(r => r.json()).then(d => { setAnalyses(d || []); setLoading(false) })
  }, [])

  const completed = analyses.filter(a => a.status === 'completed').length

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-slate-500">Bem-vindo,</p>
          <h1 className="text-2xl font-bold text-slate-900">{profile?.full_name || 'Operador'}</h1>
          <p className="text-xs text-amber-600 font-medium mt-0.5">{profile?.organizations?.name}</p>
        </div>
        <Link href="/operador/nova-analise">
          <Button size="lg" className="gap-2 bg-amber-600 hover:bg-amber-700">
            <PlusCircle className="w-4 h-4" />
            Nova Análise
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Análises', value: analyses.length, icon: BarChart3, color: 'text-amber-600 bg-amber-50' },
          { label: 'Concluídas', value: completed, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Pendentes', value: analyses.length - completed, icon: Clock, color: 'text-slate-600 bg-slate-50' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 py-4">
              <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="font-semibold text-slate-800 mb-3">Últimas análises</h2>
        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-slate-100" />)}</div>
        ) : analyses.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-slate-400 text-sm">Nenhuma análise ainda.</p>
              <Link href="/operador/nova-analise" className="text-amber-600 text-sm hover:underline mt-1 inline-block">Criar primeira análise</Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {analyses.slice(0, 8).map(a => {
              const files = (a.files as { name: string; type: string }[]) || []
              const isClickable = a.status === 'completed'
              const card = (
                <Card key={a.id} hover={isClickable}>
                  <CardContent className="flex items-center gap-3 py-3">
                    <span className="text-lg">{files[0] ? getFileIcon(files[0].type, files[0].name) : '📁'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{a.title}</p>
                      <p className="text-xs text-slate-400">{formatDate(a.created_at)}</p>
                    </div>
                    <Badge variant={a.status === 'completed' ? 'success' : a.status === 'error' ? 'danger' : 'warning'}>
                      {a.status === 'completed' ? 'Concluída' : a.status === 'error' ? 'Erro' : 'Processando'}
                    </Badge>
                  </CardContent>
                </Card>
              )
              return isClickable ? <Link key={a.id} href={`/analysis/${a.id}`}>{card}</Link> : card
            })}
          </div>
        )}
      </div>
    </div>
  )
}
