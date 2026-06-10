import * as XLSX from 'xlsx'
import type { AnalysisResult } from '@/types'

export type ExcelSection = 'executive_summary' | 'indicators' | 'action_plan' | 'inconsistencies' | 'opportunities' | 'bottlenecks' | 'risks'

function sheetFromObjects(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) return XLSX.utils.aoa_to_sheet([['(vazio)']])
  return XLSX.utils.json_to_sheet(rows)
}

export function buildWorkbook(result: AnalysisResult, sections: ExcelSection[]): XLSX.WorkBook {
  const wb = XLSX.utils.book_new()

  if (sections.includes('executive_summary')) {
    const es = result.executive_summary
    XLSX.utils.book_append_sheet(wb, sheetFromObjects([
      { campo: 'Título', valor: es.title },
      { campo: 'Visão geral', valor: es.overview },
      { campo: 'Período', valor: es.period ?? '—' },
      { campo: 'Score de saúde', valor: `${result.diagnosis.health_score}/100` },
      ...es.key_highlights.map((h, i) => ({ campo: `Destaque ${i + 1}`, valor: h })),
      ...es.data_sources.map((d, i) => ({ campo: `Fonte ${i + 1}`, valor: d })),
    ]), 'Resumo')
  }

  if (sections.includes('indicators')) {
    XLSX.utils.book_append_sheet(wb, sheetFromObjects((result.indicators ?? []).map(i => ({
      Nome: i.name, Valor: i.value, Unidade: i.unit ?? '', Categoria: i.category,
      Status: i.status, Tendência: i.trend ?? '', Variação: i.trend_value ?? '',
    }))), 'Indicadores')
  }
  if (sections.includes('action_plan')) {
    XLSX.utils.book_append_sheet(wb, sheetFromObjects((result.action_plan ?? []).map(a => ({
      Prioridade: a.priority, Título: a.title, Descrição: a.description,
      Responsável: a.responsible ?? '', Prazo: a.deadline,
      ResultadoEsperado: a.expected_result, Esforço: a.effort, Categoria: a.category,
    }))), 'Plano de Ação')
  }
  if (sections.includes('inconsistencies')) {
    XLSX.utils.book_append_sheet(wb, sheetFromObjects((result.inconsistencies ?? []).map(x => ({
      Título: x.title, Descrição: x.description, Local: x.location, Sugestão: x.suggestion, Severidade: x.severity,
    }))), 'Inconsistências')
  }
  if (sections.includes('opportunities')) {
    XLSX.utils.book_append_sheet(wb, sheetFromObjects((result.opportunities ?? []).map(x => ({
      Título: x.title, Descrição: x.description, Impacto: x.potential_impact, Esforço: x.effort, Prazo: x.timeframe,
    }))), 'Oportunidades')
  }
  if (sections.includes('bottlenecks')) {
    XLSX.utils.book_append_sheet(wb, sheetFromObjects((result.bottlenecks ?? []).map(x => ({
      Título: x.title, Descrição: x.description, Severidade: x.severity, Evidência: x.evidence, Impacto: x.impact,
    }))), 'Gargalos')
  }
  if (sections.includes('risks')) {
    XLSX.utils.book_append_sheet(wb, sheetFromObjects((result.risks ?? []).map(x => ({
      Título: x.title, Descrição: x.description, Severidade: x.severity, Evidência: x.evidence, Impacto: x.impact,
    }))), 'Riscos')
  }

  return wb
}

export function downloadExcel(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename)
}
