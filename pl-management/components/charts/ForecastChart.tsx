'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { FISCAL_MONTHS } from '@/lib/utils/fiscal'
import type { MonthlyKpi } from '@/types'

interface Props {
  monthly: MonthlyKpi[]
  filledIdx: number
  height?: number
}

export default function ForecastChart({ monthly, filledIdx, height = 220 }: Props) {
  const filled = monthly.slice(0, filledIdx + 1).filter(m => m.actual_sales > 0)
  const cumSales  = filled.reduce((a, m) => a + m.actual_sales, 0)
  const avg = filled.length > 0 ? filled.slice(-3).reduce((a, m) => a + m.actual_sales, 0) / Math.min(3, filled.length) : 0

  const chartData = FISCAL_MONTHS.map((name, i) => {
    const m = monthly[i]
    const actual = i <= filledIdx && m.actual_sales > 0 ? m.actual_sales : null
    const forecast = i > filledIdx ? Math.round(cumSales / filled.length * (i - filledIdx) + cumSales) : null
    return { name, 実績: actual, 予測: i === filledIdx ? m.actual_sales : forecast, 計画: m.plan_sales }
  })

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2e3250" />
        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#fff', fontWeight: 700 }}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 8 }} />
        <ReferenceLine x={FISCAL_MONTHS[filledIdx]} stroke="#3e4270" strokeDasharray="4 4" label={{ value: '現在', fill: '#64748b', fontSize: 10 }} />
        <Line type="monotone" dataKey="実績" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} connectNulls={false} />
        <Line type="monotone" dataKey="予測" stroke="#6366f1" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3 }} connectNulls />
        <Line type="monotone" dataKey="計画" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  )
}
