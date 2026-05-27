'use client'

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import type { Chart, SummaryCard } from '@/types'
import { cn } from '@/lib/utils'

const COLORS = ['#1E3A5F', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316']

export function SummaryCards({ cards }: { cards: SummaryCard[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500 mb-1">{card.title}</p>
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
      ))}
    </div>
  )
}

export function ChartRenderer({ chart }: { chart: Chart }) {
  const colors = chart.colors || COLORS

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
      <h3 className="font-semibold text-slate-700 text-sm mb-4">{chart.title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        {chart.type === 'bar' ? (
          <BarChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey={chart.x_key || 'label'} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            {(chart.y_keys || ['value']).map((key, i) => (
              <Bar key={key} dataKey={key} fill={colors[i % colors.length]} radius={[3, 3, 0, 0]} />
            ))}
          </BarChart>
        ) : chart.type === 'line' ? (
          <LineChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey={chart.x_key || 'label'} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            {(chart.y_keys || ['value']).map((key, i) => (
              <Line key={key} type="monotone" dataKey={key} stroke={colors[i % colors.length]} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        ) : chart.type === 'area' ? (
          <AreaChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey={chart.x_key || 'label'} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
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
            <Tooltip />
            <Legend />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
