'use client'

import { useState } from 'react'
import type { Alert } from '@/types'
import clsx from 'clsx'
import Link from 'next/link'

interface Props { alerts: Alert[] }

const severityConfig = {
  red:    { icon: '🔴', label: '緊急', cls: 'border-danger/40 bg-danger/5', titleCls: 'text-danger' },
  yellow: { icon: '🟡', label: '注意', cls: 'border-warning/40 bg-warning/5', titleCls: 'text-warning' },
  green:  { icon: '🟢', label: '好調', cls: 'border-success/40 bg-success/5', titleCls: 'text-success' },
}

export default function AlertList({ alerts }: Props) {
  const [filter, setFilter] = useState<'all' | 'red' | 'yellow' | 'green'>('all')
  const [showResolved, setShowResolved] = useState(false)

  const filtered = alerts.filter(a => {
    if (!showResolved && a.is_resolved) return false
    if (filter !== 'all' && a.severity !== filter) return false
    return true
  })

  if (alerts.length === 0) {
    return (
      <div className="card text-center py-16">
        <div className="text-4xl mb-3">✅</div>
        <div className="text-white font-semibold">アラートはありません</div>
        <div className="text-muted text-sm mt-1">現在、全事業が正常に推移しています</div>
      </div>
    )
  }

  return (
    <div>
      {/* フィルター */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(['all', 'red', 'yellow', 'green'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'px-3 py-1 rounded-full text-xs font-semibold transition-all border',
              filter === f
                ? f === 'red' ? 'bg-danger/20 text-danger border-danger/40'
                  : f === 'yellow' ? 'bg-warning/20 text-warning border-warning/40'
                  : f === 'green' ? 'bg-success/20 text-success border-success/40'
                  : 'bg-accent/20 text-accent border-accent/40'
                : 'border-border text-muted hover:text-white hover:border-subtle'
            )}
          >
            {f === 'all' ? '全て' : f === 'red' ? '🔴 緊急' : f === 'yellow' ? '🟡 注意' : '🟢 好調'}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-1.5 text-xs text-muted cursor-pointer">
          <input type="checkbox" checked={showResolved} onChange={e => setShowResolved(e.target.checked)} />
          解決済みを表示
        </label>
      </div>

      <div className="space-y-3">
        {filtered.map(alert => {
          const s = severityConfig[alert.severity]
          const bizName = (alert as any).businesses?.name ?? ''
          return (
            <div
              key={alert.id}
              className={clsx('flex items-start gap-3 p-4 rounded-xl border-l-[3px]', s.cls)}
            >
              <span className="text-xl shrink-0 mt-0.5">{s.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className={clsx('font-bold text-sm', s.titleCls)}>{alert.title}</div>
                  <span className={clsx('shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded',
                    alert.severity === 'red' ? 'bg-danger/20 text-danger'
                    : alert.severity === 'yellow' ? 'bg-warning/20 text-warning'
                    : 'bg-success/20 text-success'
                  )}>{s.label}</span>
                </div>
                {alert.description && (
                  <div className="text-xs text-muted mt-1">{alert.description}</div>
                )}
                <div className="flex items-center gap-3 mt-2">
                  {bizName && (
                    <span className="text-[11px] text-subtle">📌 {bizName}</span>
                  )}
                  <span className="text-[11px] text-muted">
                    {new Date(alert.created_at).toLocaleDateString('ja-JP')}
                  </span>
                  {alert.is_resolved && (
                    <span className="badge-green text-[10px]">✅ 解決済み</span>
                  )}
                </div>
              </div>
              <Link
                href={`/businesses/${alert.business_id}`}
                className="btn-ghost px-2 py-1 text-[11px] shrink-0"
              >
                詳細 →
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
