import Link from 'next/link'
import type { Alert } from '@/types'
import clsx from 'clsx'

interface Props { alerts: Alert[] }

const severityMap = {
  red:    { icon: '🔴', cls: 'border-danger bg-danger/5' },
  yellow: { icon: '🟡', cls: 'border-warning bg-warning/5' },
  green:  { icon: '🟢', cls: 'border-success bg-success/5' },
}

export default function AlertPanel({ alerts }: Props) {
  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="section-title">🔔 アラート</div>
        <Link href="/analysis/alerts" className="text-xs text-accent hover:text-accent-2 font-semibold">
          全て見る →
        </Link>
      </div>

      {alerts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <div className="text-3xl mb-2">✅</div>
            <div className="text-sm text-muted">アラートはありません</div>
          </div>
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto flex-1">
          {alerts.map(alert => {
            const s = severityMap[alert.severity]
            return (
              <div
                key={alert.id}
                className={clsx('flex items-start gap-2.5 p-3 rounded-lg border-l-2', s.cls)}
              >
                <span className="text-sm shrink-0 mt-0.5">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white leading-tight">{alert.title}</div>
                  {alert.description && (
                    <div className="text-[11px] text-muted mt-0.5 truncate">{alert.description}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
