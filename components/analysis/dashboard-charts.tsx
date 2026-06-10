'use client'

import { useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { BarChart3, LineChart as LineIcon, PieChart as PieIcon, AreaChart as AreaIcon, ChevronDown, Info } from 'lucide-react'
import type { Chart, SummaryCard } from '@/types'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/tooltip'
import { getFormulaTooltip } from '@/lib/ai/metric-formulas'

const COLORS = ['#1E3A5F', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316']

type ChartType = 'bar' | 'line' | 'pie' | 'area'

const CHART_TYPE_LABELS: Record<ChartType, string> = {
  bar: 'Barras',
  line: 'Linha',
  area: 'Área',
  pie: 'Pizza',
}

const CHART_TYPE_ICONS: Record<ChartType, React.ComponentType<{ className?: string }>> = {
  bar: BarChart3,
  line: LineIcon,
  area: AreaIcon,
  pie: PieIcon,
}

export function SummaryCards({ cards, locale = 'pt' }: { cards: SummaryCard[]; locale?: 'pt' | 'en' | 'es' }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const formula = getFormulaTooltip(card.title, locale)
        return (
          <div key={i} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-1 mb-1">
              <p className="text-xs text-slate-500">{card.title}</p>
              {formula && (
                <Tooltip
                  side="top"
                  content={
                    <div className="space-y-1">
                      <p className="font-semibold">{formula.formula}</p>
                      <p className="text-slate-200">{formula.description}</p>
                    </div>
                  }
                >
                  <button type="button" aria-label={`Definição de ${card.title}`} className="text-slate-400 hover:text-slate-600">
                    <Info className="w-3 h-3" />
                  </button>
                </Tooltip>
              )}
            </div>
            <p className="text-2xl font-bold text-slate-800">{card.value}</p>
            {card.change && (
              <p className={cn(
                'text-xs mt-1 font-medium',
                card.trend === 'up' ? 'text-emerald-600' :
                card.trend === 'down' ? 'text-red-600' : 'text-slate-500'
              )}>
                {card.trend === 'up' ? '↑' : card.trend === 'down' ? '↓' : '→'} {card.change}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function ChartRenderer({ chart }: { chart: Chart }) {
  const [chartType, setChartType] = useState<ChartType>(
    (chart.type === 'composed' ? 'bar' : chart.type) as ChartType,
  )
  const colors = chart.colors || COLORS
  const ActiveIcon = CHART_TYPE_ICONS[chartType]

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-700 text-sm">{chart.title}</h3>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            aria-label="Trocar tipo de gráfico"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-md"
          >
            <ActiveIcon className="w-3 h-3" />
            {CHART_TYPE_LABELS[chartType]}
            <ChevronDown className="w-3 h-3" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={4}
              className="z-50 min-w-[140px] rounded-md bg-white border border-slate-200 shadow-lg p-1"
            >
              {(Object.keys(CHART_TYPE_LABELS) as ChartType[]).map((t) => {
                const Icon = CHART_TYPE_ICONS[t]
                return (
                  <DropdownMenu.Item
                    key={t}
                    onSelect={() => setChartType(t)}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 text-xs rounded cursor-pointer outline-none',
                      'data-[highlighted]:bg-slate-100 text-slate-700',
                      chartType === t && 'font-semibold text-[#1E3A5F]',
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {CHART_TYPE_LABELS[t]}
                  </DropdownMenu.Item>
                )
              })}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        {chartType === 'bar' ? (
          <BarChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey={chart.x_key || 'label'} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <RechartsTooltip />
            <Legend />
            {(chart.y_keys || ['value']).map((key, i) => (
              <Bar key={key} dataKey={key} fill={colors[i % colors.length]} radius={[3, 3, 0, 0]} />
            ))}
          </BarChart>
        ) : chartType === 'line' ? (
          <LineChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey={chart.x_key || 'label'} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <RechartsTooltip />
            <Legend />
            {(chart.y_keys || ['value']).map((key, i) => (
              <Line key={key} type="monotone" dataKey={key} stroke={colors[i % colors.length]} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        ) : chartType === 'area' ? (
          <AreaChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey={chart.x_key || 'label'} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <RechartsTooltip />
            <Legend />
            {(chart.y_keys || ['value']).map((key, i) => (
              <Area key={key} type="monotone" dataKey={key} stroke={colors[i % colors.length]} fill={`${colors[i % colors.length]}20`} strokeWidth={2} />
            ))}
          </AreaChart>
        ) : (
          <PieChart>
            <Pie data={chart.data} dataKey={chart.y_keys?.[0] || 'value'} nameKey={chart.x_key || 'label'} cx="50%" cy="50%" outerRadius={80} label>
              {chart.data.map((_, index) => (
                <Cell key={index} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <RechartsTooltip />
            <Legend />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
