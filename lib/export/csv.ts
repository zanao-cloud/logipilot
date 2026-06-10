import type { AnalysisResult } from '@/types'

function escapeCsv(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value)
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function rowsToCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return ''
  const headers = Array.from(new Set(rows.flatMap(r => Object.keys(r))))
  const out: string[] = [headers.join(',')]
  for (const r of rows) {
    out.push(headers.map(h => escapeCsv(r[h])).join(','))
  }
  return out.join('\n')
}

export type CsvSection = 'indicators' | 'action_plan' | 'inconsistencies' | 'opportunities' | 'bottlenecks' | 'risks'

export function buildCsv(result: AnalysisResult, section: CsvSection): string {
  switch (section) {
    case 'indicators':
      return rowsToCsv((result.indicators ?? []).map(i => ({
        nome: i.name, valor: i.value, unidade: i.unit ?? '', categoria: i.category,
        status: i.status, tendencia: i.trend ?? '', variacao: i.trend_value ?? '',
      })))
    case 'action_plan':
      return rowsToCsv((result.action_plan ?? []).map(a => ({
        prioridade: a.priority, titulo: a.title, descricao: a.description,
        responsavel: a.responsible ?? '', prazo: a.deadline, resultado_esperado: a.expected_result,
        esforco: a.effort, categoria: a.category,
      })))
    case 'inconsistencies':
      return rowsToCsv((result.inconsistencies ?? []).map(x => ({
        titulo: x.title, descricao: x.description, local: x.location,
        sugestao: x.suggestion, severidade: x.severity,
      })))
    case 'opportunities':
      return rowsToCsv((result.opportunities ?? []).map(x => ({
        titulo: x.title, descricao: x.description, impacto_potencial: x.potential_impact,
        esforco: x.effort, prazo: x.timeframe,
      })))
    case 'bottlenecks':
      return rowsToCsv((result.bottlenecks ?? []).map(x => ({
        titulo: x.title, descricao: x.description, severidade: x.severity,
        evidencia: x.evidence, impacto: x.impact,
      })))
    case 'risks':
      return rowsToCsv((result.risks ?? []).map(x => ({
        titulo: x.title, descricao: x.description, severidade: x.severity,
        evidencia: x.evidence, impacto: x.impact,
      })))
  }
}

export function downloadCsv(content: string, filename: string) {
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
