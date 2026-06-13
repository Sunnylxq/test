'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'
import type { MonthlyKpi } from '@/types'
import { FISCAL_MONTHS } from '@/lib/utils/fiscal'

interface Props {
  data: MonthlyKpi[]
  filledIdx: number
  height?: number
  color?: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg2 border border-border rounded-lg p-3 text-xs shadow-card">
      <div className="font-bold text-white mb-2">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span style={{ color: p.color }}>●</span>
          <span className="text-subtle">{p.name}:</span>
          <span className="text-white font-semibold">¥{p.value?.toLocaleString()}M</span>
        </div>
      ))}
    </div>
  )
}

export default function SalesTrendChart({ data, filledIdx, height = 200, color = '#6366f1' }: Props) {
  const chartData = data.map((m, i) => ({
    name: FISCAL_MONTHS[i],
    実績: i <= filledIdx && m.actual_sales > 0 ? m.actual_sales : null,
    計画: m.plan_sales || null,
    前年: m.prev_sales || null,
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2e3250" />
        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}`} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 8 }} />
        <Line type="monotone" dataKey="実績" stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color }} connectNulls={false} />
        <Line type="monotone" dataKey="計画" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 4" dot={false} connectNulls />
        <Line type="monotone" dataKey="前年" stroke="#334155" strokeWidth={1.5} dot={false} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  )
}
