/**
 * Engine de previsão estatística pura — sem dependências externas.
 * Implementa: regressão linear, média móvel simples, Holt's linear trend.
 * Intervalo de confiança a 95% baseado no erro padrão dos resíduos in-sample.
 */

export type ForecastMethod = 'linear' | 'moving_avg' | 'holt'

export type SeriesPoint = {
  label: string
  value: number
}

export type ForecastPoint = {
  label: string
  value: number
  ci_low: number
  ci_high: number
}

export type ForecastInput = {
  series: SeriesPoint[]
  horizon: number
  method?: ForecastMethod
}

export type ForecastOutput = {
  method: ForecastMethod
  predictions: ForecastPoint[]
  rmse: number
  trend: 'up' | 'down' | 'stable'
  trendPct: number
}

const Z_95 = 1.96

function mean(xs: number[]): number {
  if (xs.length === 0) return 0
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

function stdDev(xs: number[]): number {
  if (xs.length < 2) return 0
  const m = mean(xs)
  const variance = xs.reduce((acc, x) => acc + (x - m) ** 2, 0) / (xs.length - 1)
  return Math.sqrt(variance)
}

function rmseOf(actual: number[], predicted: number[]): number {
  if (actual.length === 0 || actual.length !== predicted.length) return 0
  const errs = actual.map((a, i) => (a - predicted[i]) ** 2)
  return Math.sqrt(errs.reduce((a, b) => a + b, 0) / actual.length)
}

/**
 * Detecta se os rótulos parecem datas e gera os próximos N rótulos.
 * Caso contrário, gera "label + n" continuando a numeração.
 */
function nextLabels(historical: SeriesPoint[], horizon: number): string[] {
  const labels = historical.map(p => p.label)
  const last = labels[labels.length - 1] ?? ''

  // tenta data ISO
  const asDate = new Date(last)
  if (!isNaN(asDate.getTime()) && /\d{4}-\d{2}/.test(last)) {
    const prev = new Date(labels[labels.length - 2] ?? last)
    const stepMs = !isNaN(prev.getTime()) ? asDate.getTime() - prev.getTime() : 30 * 86400 * 1000
    return Array.from({ length: horizon }, (_, i) => {
      const d = new Date(asDate.getTime() + stepMs * (i + 1))
      return d.toISOString().slice(0, last.length)
    })
  }

  // tenta inteiro
  const lastN = parseInt(last.replace(/\D+/g, ''))
  if (!isNaN(lastN)) {
    const prefix = last.replace(/\d+$/, '')
    return Array.from({ length: horizon }, (_, i) => `${prefix}${lastN + i + 1}`)
  }

  // fallback genérico
  return Array.from({ length: horizon }, (_, i) => `t+${i + 1}`)
}

/**
 * Regressão linear simples por mínimos quadrados.
 */
export function linearForecast(input: ForecastInput): ForecastOutput {
  const { series, horizon } = input
  const n = series.length
  if (n < 2) {
    return emptyForecast('linear', series, horizon)
  }
  const xs = Array.from({ length: n }, (_, i) => i)
  const ys = series.map(p => p.value)
  const xMean = mean(xs)
  const yMean = mean(ys)

  let num = 0, den = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (ys[i] - yMean)
    den += (xs[i] - xMean) ** 2
  }
  const slope = den === 0 ? 0 : num / den
  const intercept = yMean - slope * xMean

  const inSample = xs.map(x => intercept + slope * x)
  const rmse = rmseOf(ys, inSample)
  const labels = nextLabels(series, horizon)

  const predictions: ForecastPoint[] = labels.map((label, i) => {
    const x = n + i
    const value = intercept + slope * x
    const margin = Z_95 * rmse * Math.sqrt(1 + 1 / n)
    return { label, value, ci_low: value - margin, ci_high: value + margin }
  })

  const trend = computeTrend(ys, predictions.map(p => p.value))
  return { method: 'linear', predictions, rmse, ...trend }
}

/**
 * Média móvel simples com janela adaptativa (min 2, max series.length / 2).
 */
export function movingAverageForecast(input: ForecastInput): ForecastOutput {
  const { series, horizon } = input
  const n = series.length
  if (n < 2) return emptyForecast('moving_avg', series, horizon)
  const window = Math.max(2, Math.min(Math.floor(n / 2), 6))
  const ys = series.map(p => p.value)

  const inSample: number[] = []
  for (let i = 0; i < n; i++) {
    const slice = ys.slice(Math.max(0, i - window + 1), i + 1)
    inSample.push(mean(slice))
  }
  const rmse = rmseOf(ys.slice(window - 1), inSample.slice(window - 1))
  const labels = nextLabels(series, horizon)

  const extended = [...ys]
  const predictions: ForecastPoint[] = labels.map((label) => {
    const slice = extended.slice(-window)
    const value = mean(slice)
    extended.push(value)
    const margin = Z_95 * rmse
    return { label, value, ci_low: value - margin, ci_high: value + margin }
  })

  const trend = computeTrend(ys, predictions.map(p => p.value))
  return { method: 'moving_avg', predictions, rmse, ...trend }
}

/**
 * Holt's linear trend exponential smoothing (sem sazonalidade).
 * α (level) e β (trend) fixos em valores razoáveis para séries curtas.
 */
export function holtForecast(input: ForecastInput): ForecastOutput {
  const { series, horizon } = input
  const n = series.length
  if (n < 3) return linearForecast(input)
  const alpha = 0.5
  const beta = 0.3
  const ys = series.map(p => p.value)

  let level = ys[0]
  let trend = ys[1] - ys[0]
  const fitted: number[] = [level + trend]

  for (let t = 1; t < n; t++) {
    const prevLevel = level
    level = alpha * ys[t] + (1 - alpha) * (level + trend)
    trend = beta * (level - prevLevel) + (1 - beta) * trend
    fitted.push(level + trend)
  }

  const rmse = rmseOf(ys.slice(1), fitted.slice(0, -1))
  const labels = nextLabels(series, horizon)

  const predictions: ForecastPoint[] = labels.map((label, h) => {
    const value = level + (h + 1) * trend
    const margin = Z_95 * rmse * Math.sqrt(h + 1)
    return { label, value, ci_low: value - margin, ci_high: value + margin }
  })

  const trendInfo = computeTrend(ys, predictions.map(p => p.value))
  return { method: 'holt', predictions, rmse, ...trendInfo }
}

function emptyForecast(method: ForecastMethod, series: SeriesPoint[], horizon: number): ForecastOutput {
  const lastValue = series[series.length - 1]?.value ?? 0
  const labels = nextLabels(series, horizon)
  return {
    method,
    predictions: labels.map(label => ({ label, value: lastValue, ci_low: lastValue, ci_high: lastValue })),
    rmse: 0,
    trend: 'stable',
    trendPct: 0,
  }
}

function computeTrend(historical: number[], predicted: number[]): { trend: 'up' | 'down' | 'stable'; trendPct: number } {
  const lastHistorical = historical[historical.length - 1]
  const lastPredicted = predicted[predicted.length - 1]
  if (lastHistorical === 0 || !isFinite(lastHistorical)) return { trend: 'stable', trendPct: 0 }
  const pct = ((lastPredicted - lastHistorical) / Math.abs(lastHistorical)) * 100
  if (Math.abs(pct) < 2) return { trend: 'stable', trendPct: pct }
  return { trend: pct > 0 ? 'up' : 'down', trendPct: pct }
}

/**
 * Escolhe automaticamente o melhor método baseado no tamanho da série.
 */
export function autoPickMethod(seriesLength: number): ForecastMethod {
  if (seriesLength < 3) return 'linear'
  if (seriesLength < 6) return 'moving_avg'
  return 'holt'
}

export function forecast(input: ForecastInput): ForecastOutput {
  const method = input.method ?? autoPickMethod(input.series.length)
  switch (method) {
    case 'linear': return linearForecast(input)
    case 'moving_avg': return movingAverageForecast(input)
    case 'holt': return holtForecast(input)
  }
}

export function describeTrend(out: ForecastOutput, locale: 'pt' | 'en' | 'es' = 'pt'): string {
  const dir = out.trend === 'up' ? 'subida' : out.trend === 'down' ? 'queda' : 'estabilidade'
  const dirEn = out.trend === 'up' ? 'increase' : out.trend === 'down' ? 'decrease' : 'stability'
  const dirEs = out.trend === 'up' ? 'aumento' : out.trend === 'down' ? 'caída' : 'estabilidad'
  const pct = Math.abs(out.trendPct).toFixed(1)
  if (locale === 'en') return `${dirEn} of ${pct}% over the forecast horizon`
  if (locale === 'es') return `${dirEs} del ${pct}% en el horizonte de previsión`
  return `${dir} de ${pct}% no horizonte previsto`
}
