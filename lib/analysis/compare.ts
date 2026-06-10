import type { AnalysisResult, Indicator } from '@/types'

export type ComparisonRow = {
  name: string
  unit?: string
  valueA: number | null
  valueB: number | null
  rawA?: string | number
  rawB?: string | number
  delta: number | null
  deltaPct: number | null
  direction: 'better' | 'worse' | 'neutral'
}

const HIGHER_IS_BETTER_KEYWORDS = [
  'otif', 'pontualidade', 'on time', 'eficiencia', 'eficiência', 'satisfação', 'nps',
  'margem', 'margin', 'ocupação', 'ocupacao', 'utilização', 'utilizacao', 'load factor',
  'fill rate', 'receita', 'revenue', 'lucro', 'consumo médio', 'km/l', 'km por litro',
]

const LOWER_IS_BETTER_KEYWORDS = [
  'custo', 'cost', 'despesa', 'avaria', 'devolução', 'devolucao', 'atraso',
  'lead time', 'tempo de ciclo', 'cycle time', 'reclamação', 'reclamacao',
  'tax', 'imposto', 'consumo de combustível', 'consumo de combustivel',
]

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

function detectDirection(name: string): 'higher' | 'lower' | 'unknown' {
  const n = normalize(name)
  if (HIGHER_IS_BETTER_KEYWORDS.some(k => n.includes(k))) return 'higher'
  if (LOWER_IS_BETTER_KEYWORDS.some(k => n.includes(k))) return 'lower'
  return 'unknown'
}

function parseNumeric(value: string | number | undefined | null): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return isFinite(value) ? value : null
  const cleaned = String(value).replace(/[%R$\s.]/g, '').replace(',', '.').trim()
  const n = parseFloat(cleaned)
  return isFinite(n) ? n : null
}

export function compareAnalyses(a: AnalysisResult, b: AnalysisResult): ComparisonRow[] {
  const mapA = new Map<string, Indicator>()
  for (const ind of (a.indicators || [])) {
    mapA.set(normalize(ind.name), ind)
  }
  const mapB = new Map<string, Indicator>()
  for (const ind of (b.indicators || [])) {
    mapB.set(normalize(ind.name), ind)
  }

  const allKeys = new Set<string>([...mapA.keys(), ...mapB.keys()])
  const rows: ComparisonRow[] = []

  for (const key of allKeys) {
    const indA = mapA.get(key)
    const indB = mapB.get(key)
    const valueA = parseNumeric(indA?.value)
    const valueB = parseNumeric(indB?.value)
    const direction = detectDirection(indA?.name || indB?.name || '')

    let delta: number | null = null
    let deltaPct: number | null = null
    let dir: 'better' | 'worse' | 'neutral' = 'neutral'

    if (valueA !== null && valueB !== null) {
      delta = valueB - valueA
      deltaPct = valueA !== 0 ? (delta / Math.abs(valueA)) * 100 : null
      if (delta !== 0 && direction !== 'unknown') {
        const wentUp = delta > 0
        dir = (direction === 'higher' && wentUp) || (direction === 'lower' && !wentUp) ? 'better' : 'worse'
      }
    }

    rows.push({
      name: indA?.name || indB?.name || key,
      unit: indA?.unit || indB?.unit,
      valueA,
      valueB,
      rawA: indA?.value,
      rawB: indB?.value,
      delta,
      deltaPct,
      direction: dir,
    })
  }

  return rows.sort((x, y) => x.name.localeCompare(y.name))
}

export function summarizeComparison(rows: ComparisonRow[]) {
  return {
    total: rows.length,
    better: rows.filter(r => r.direction === 'better').length,
    worse: rows.filter(r => r.direction === 'worse').length,
    neutral: rows.filter(r => r.direction === 'neutral').length,
  }
}
