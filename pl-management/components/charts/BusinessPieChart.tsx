'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { BusinessKpi } from '@/types'

interface Props {
  data: BusinessKpi[]
  height?: number
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-bg2 border border-border rounded-lg p-3 text-xs shadow-card">
      <div className="font-bold text-white mb-1">{d.name}</div>
      <div className="text-subtle">¥{d.value?.toLocaleString()}M</div>
      <div className="text-accent">{d.payload.pct?.toFixed(1)}%</div>
    </div>
  )
}

export default function BusinessPieChart({ data, height = 200 }: Props) {
  const total = data.reduce((a, b) => a + b.cum_sales, 0)
  const chartData = data.map(b => ({
    name: b.business.name.split('（')[0],
    value: Math.round(b.cum_sales),
    pct:   total > 0 ? (b.cum_sales / total) * 100 : 0,
    color: b.business.color,
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color + 'cc'} stroke="var(--bg)" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{value}</span>}
          iconType="circle"
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
