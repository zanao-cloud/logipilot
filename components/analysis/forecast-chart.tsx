'use client'

import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceDot,
} from 'recharts'
import type { ForecastPoint, SeriesPoint } from '@/lib/analysis/forecast'

export type ForecastChartData = {
  historical: SeriesPoint[]
  predictions: ForecastPoint[]
}

type Row = {
  label: string
  historical: number | null
  forecast: number | null
  ci_low: number | null
  ci_high: number | null
  ci_band: [number, number] | null
}

function buildRows({ historical, predictions }: ForecastChartData): Row[] {
  const bridgeIndex = historical.length - 1
  const rows: Row[] = []
  historical.forEach((p, i) => {
    rows.push({
      label: p.label,
      historical: p.value,
      forecast: i === bridgeIndex ? p.value : null,
      ci_low: null, ci_high: null, ci_band: null,
    })
  })
  predictions.forEach((p) => {
    rows.push({
      label: p.label,
      historical: null,
      forecast: p.value,
      ci_low: p.ci_low,
      ci_high: p.ci_high,
      ci_band: [p.ci_low, p.ci_high],
    })
  })
  return rows
}

export function ForecastChart({
  data,
  unit,
  height = 260,
}: {
  data: ForecastChartData
  unit?: string | null
  height?: number
}) {
  const rows = buildRows(data)
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value, name) => {
              const safeName = (name ?? '') as string
              if (value === null || value === undefined) return ['—', safeName]
              const num = typeof value === 'number' ? value : Number(value)
              return [`${num.toFixed(2)}${unit ? ` ${unit}` : ''}`, safeName]
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="ci_band"
            name="IC 95%"
            stroke="none"
            fill="#10B981"
            fillOpacity={0.15}
            connectNulls
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="historical"
            name="Histórico"
            stroke="#1E3A5F"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            name="Previsão"
            stroke="#10B981"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 3 }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
