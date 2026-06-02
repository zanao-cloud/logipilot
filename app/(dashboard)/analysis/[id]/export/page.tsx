'use client'

import { useState, useEffect } from 'react'
import { Download, FileText, Loader2, CheckCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import type { Analysis } from '@/types'

export default function ExportPage({ params }: { params: Promise<{ id: string }> }) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/analyses/${id}`)
        .then(r => r.json())
        .then(data => { setAnalysis(data); setLoading(false) })
        .catch(() => setLoading(false))
    })
  }, [params])

  async function handleExport() {
    if (!analysis?.result) return
    setExporting(true)

    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const result = analysis.result

      const NAVY = [15, 27, 45] as [number, number, number]
      const EMERALD = [16, 185, 129] as [number, number, number]
      const GRAY = [71, 85, 105] as [number, number, number]
      const LIGHT = [241, 245, 249] as [number, number, number]

      let y = 0

      // Cover
      doc.setFillColor(...NAVY)
      doc.rect(0, 0, 210, 80, 'F')
      doc.setFillColor(...EMERALD)
      doc.rect(0, 75, 210, 3, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('LOGIPILOT AI — ANÁLISE OPERACIONAL', 20, 25)

      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      const titleLines = doc.splitTextToSize(result.executive_summary.title, 170)
      doc.text(titleLines, 20, 40)

      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(180, 200, 220)
      doc.text(`Gerado em ${formatDate(analysis.created_at)}`, 20, 68)
      if (result.executive_summary.period) {
        doc.text(`Período: ${result.executive_summary.period}`, 20, 74)
      }

      y = 95

      // Helper functions
      const section = (title: string) => {
        if (y > 260) { doc.addPage(); y = 20 }
        doc.setFillColor(...LIGHT)
        doc.rect(15, y - 4, 180, 10, 'F')
        doc.setFillColor(...NAVY)
        doc.rect(15, y - 4, 3, 10, 'F')
        doc.setTextColor(...NAVY)
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text(title, 22, y + 3)
        y += 12
      }

      const para = (text: string, indent = 0) => {
        if (y > 270) { doc.addPage(); y = 20 }
        doc.setTextColor(...GRAY)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        const lines = doc.splitTextToSize(text, 165 - indent)
        doc.text(lines, 20 + indent, y)
        y += lines.length * 5 + 2
      }

      const bullet = (text: string) => {
        if (y > 270) { doc.addPage(); y = 20 }
        doc.setFillColor(...EMERALD)
        doc.circle(22, y - 1, 1, 'F')
        doc.setTextColor(...GRAY)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        const lines = doc.splitTextToSize(text, 155)
        doc.text(lines, 27, y)
        y += lines.length * 5 + 1
      }

      // Executive Summary
      section('RESUMO EXECUTIVO')
      para(result.executive_summary.overview)
      y += 4
      if (result.executive_summary.key_highlights.length) {
        doc.setTextColor(...NAVY)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text('Destaques:', 20, y)
        y += 5
        result.executive_summary.key_highlights.forEach(h => bullet(h))
      }

      // Diagnosis
      y += 4
      section('DIAGNÓSTICO DA IA')
      doc.setTextColor(...NAVY)
      doc.setFontSize(28)
      doc.setFont('helvetica', 'bold')
      doc.text(`${result.diagnosis.health_score}`, 20, y + 10)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...GRAY)
      doc.text('/100 — Score Operacional', 38, y + 7)
      y += 16
      para(result.diagnosis.overall_assessment)

      if (result.diagnosis.observed_facts.length) {
        y += 3
        doc.setTextColor(...NAVY)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text('Fatos observados:', 20, y); y += 5
        result.diagnosis.observed_facts.slice(0, 5).forEach(f => bullet(f))
      }

      if (result.diagnosis.recommendations.length) {
        y += 3
        doc.setTextColor(...NAVY)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text('Recomendações:', 20, y); y += 5
        result.diagnosis.recommendations.slice(0, 5).forEach(r => bullet(r))
      }

      // Indicators
      if (result.indicators.length) {
        y += 4
        section('INDICADORES')
        result.indicators.forEach(ind => {
          if (y > 270) { doc.addPage(); y = 20 }
          doc.setTextColor(...NAVY)
          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.text(`${ind.name}: `, 20, y)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(...GRAY)
          doc.text(`${ind.value}${ind.unit || ''} (${ind.category})`, 20 + doc.getTextWidth(`${ind.name}: `), y)
          y += 6
        })
      }

      // Action plan
      if (result.action_plan.length) {
        y += 4
        section('PLANO DE AÇÃO')
        result.action_plan.forEach(action => {
          if (y > 265) { doc.addPage(); y = 20 }
          doc.setFillColor(...NAVY)
          doc.roundedRect(15, y - 4, 180, 18 + Math.ceil(action.description.length / 80) * 5, 2, 2, 'F')
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.text(`${action.priority}. ${action.title}`, 22, y + 1)
          doc.setFont('helvetica', 'normal')
          const descLines = doc.splitTextToSize(action.description, 155)
          doc.text(descLines, 22, y + 7)
          doc.setTextColor(180, 200, 220)
          doc.text(`Prazo: ${action.deadline}`, 22, y + 7 + descLines.length * 4 + 1)
          y += 20 + descLines.length * 4
          y += 3
        })
      }

      // Limitations
      if (result.limitations.length) {
        y += 4
        section('LIMITAÇÕES DA ANÁLISE')
        result.limitations.forEach(l => bullet(l))
      }

      // Footer on all pages
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFillColor(...LIGHT)
        doc.rect(0, 285, 210, 12, 'F')
        doc.setTextColor(150, 150, 150)
        doc.setFontSize(7)
        doc.text('LogiPilot AI — Central Inteligente de Análise Operacional Multimodal', 20, 292)
        doc.text(`Página ${i} de ${pageCount}`, 175, 292)
      }

      doc.save(`logipilot-${analysis.id.slice(0, 8)}.pdf`)
      setDone(true)
    } catch (err) {
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
  if (!analysis?.result) return <div className="text-slate-500 text-center py-12">Análise não disponível para exportação</div>

  const result = analysis.result

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Exportar Relatório PDF</h2>
        <p className="text-slate-500 text-sm mt-1">
          Gera um relatório executivo completo em PDF com toda a análise
        </p>
      </div>

      {/* Preview */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-20 bg-gradient-to-br from-[#0F1B2D] to-[#1E3A5F] rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800">{result.executive_summary.title}</h3>
              <p className="text-sm text-slate-500 mt-1">{formatDate(analysis.created_at)}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                {[
                  'Resumo executivo',
                  `${result.indicators.length} indicadores`,
                  `Score: ${result.diagnosis.health_score}/100`,
                  `${result.action_plan.length} ações`,
                  `${result.bottlenecks.length} gargalos`,
                  `${result.inconsistencies.length} inconsistências`,
                ].map(label => (
                  <div key={label} className="flex items-center gap-1.5 text-slate-600">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {done && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
          <CheckCircle className="w-4 h-4" />
          Relatório exportado com sucesso!
        </div>
      )}

      <Button onClick={handleExport} loading={exporting} size="lg" className="gap-2">
        <Download className="w-4 h-4" />
        {exporting ? 'Gerando PDF...' : 'Baixar Relatório PDF'}
      </Button>

      <p className="text-xs text-slate-400">
        O relatório inclui: resumo executivo, diagnóstico com IA, indicadores, gargalos,
        riscos, inconsistências, plano de ação e limitações da análise.
      </p>
    </div>
  )
}
