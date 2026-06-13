import clsx from 'clsx'

type KpiColor = 'blue' | 'green' | 'red' | 'purple' | 'cyan' | 'yellow'

interface KpiCardProps {
  icon: string
  label: string
  value: string
  sub?: string
  change?: number
  changeLabel?: string
  color?: KpiColor
  loading?: boolean
}

const colorMap: Record<KpiColor, { bar: string; text: string; bg: string }> = {
  blue:   { bar: 'bg-info',    text: 'text-info',    bg: 'bg-info/10' },
  green:  { bar: 'bg-success', text: 'text-success', bg: 'bg-success/10' },
  red:    { bar: 'bg-danger',  text: 'text-danger',  bg: 'bg-danger/10' },
  purple: { bar: 'bg-accent',  text: 'text-accent',  bg: 'bg-accent/10' },
  cyan:   { bar: 'bg-info',    text: 'text-info',    bg: 'bg-info/10' },
  yellow: { bar: 'bg-warning', text: 'text-warning', bg: 'bg-warning/10' },
}

export default function KpiCard({
  icon, label, value, sub, change, changeLabel, color = 'blue', loading = false,
}: KpiCardProps) {
  const c = colorMap[color]
  const isPositive = (change ?? 0) >= 0

  if (loading) {
    return (
      <div className="card relative overflow-hidden animate-pulse">
        <div className={`absolute top-0 left-0 right-0 h-0.5 ${c.bar}`} />
        <div className="h-4 bg-bg3 rounded w-2/3 mb-3" />
        <div className="h-8 bg-bg3 rounded w-1/2 mb-2" />
        <div className="h-3 bg-bg3 rounded w-3/4" />
      </div>
    )
  }

  return (
    <div className="card-hover relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${c.bar}`} />
      <div className="flex items-start justify-between mb-1">
        <div className={`p-2 rounded-lg ${c.bg}`}>
          <span className="text-lg">{icon}</span>
        </div>
        {change !== undefined && (
          <span className={clsx('text-xs font-bold flex items-center gap-0.5', isPositive ? 'text-success' : 'text-danger')}>
            {isPositive ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">{label}</div>
        <div className="text-2xl font-extrabold text-white tabular-nums">{value}</div>
        {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
        {changeLabel && (
          <div className={clsx('text-xs font-semibold mt-2', isPositive ? 'text-success' : 'text-danger')}>
            {changeLabel}
          </div>
        )}
      </div>
    </div>
  )
}
