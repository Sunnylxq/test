'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'
import type { MonthlyKpi } from '@/types'
import { FISCAL_MONTHS } from '@/lib/utils/fiscal'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg2 border border-border rounded-lg p-3 text-xs shadow-card">
      <div className="font-bold text-white mb-2">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span style={{ color: p.color }}>■</span>
          <span className="text-subtle">{p.name}:</span>
          <span className="text-white font-semibold">¥{p.value?.toLocaleString()}M</span>
        </div>
      ))}
    </div>
  )
}

interface Props {
  data: MonthlyKpi[]
  filledIdx: number
  height?: number
  color?: string
}

export default function ProfitBarChart({ data, filledIdx, height = 200, color = '#10b981' }: Props) {
  const chartData = data.map((m, i) => ({
    name: FISCAL_MONTHS[i],
    実績: i <= filledIdx && m.actual_op !== 0 ? m.actual_op : null,
    計画: m.plan_op || null,
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }} barSize={10}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2e3250" />
        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 8 }} />
        <Bar dataKey="実績" fill={`${color}bb`} radius={[3, 3, 0, 0]} />
        <Bar dataKey="計画" fill="rgba(148,163,184,0.2)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
