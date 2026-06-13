'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { BusinessKpi } from '@/types'
import { FISCAL_MONTHS } from '@/lib/utils/fiscal'

interface Props {
  bizKpis: BusinessKpi[]
  filledIdx: number
  height?: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg2 border border-border rounded-lg p-3 text-xs shadow-card">
      <div className="font-bold text-white mb-2">{label}</div>
      {payload.map((p: any) => p.value != null && (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span style={{ color: p.color }}>●</span>
          <span className="text-subtle">{p.name}:</span>
          <span className="text-white font-semibold">{p.value.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  )
}

export default function MarginLineChart({ bizKpis, filledIdx, height = 200 }: Props) {
  const chartData = FISCAL_MONTHS.map((label, i) => {
    const obj: Record<string, string | number | null> = { name: label }
    bizKpis.forEach(biz => {
      const m = biz.monthly[i]
      const shortName = biz.business.name.split('（')[0]
      obj[shortName] = i <= filledIdx && m.actual_sales > 0 ? parseFloat(m.op_margin.toFixed(1)) : null
    })
    return obj
  })

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2e3250" />
        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 8 }} />
        {bizKpis.map(biz => (
          <Line
            key={biz.business.id}
            type="monotone"
            dataKey={biz.business.name.split('（')[0]}
            stroke={biz.business.color}
            strokeWidth={2}
            dot={{ r: 2.5, fill: biz.business.color }}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
