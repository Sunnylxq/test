import type { BusinessKpi } from '@/types'
import { fmtMoney, fmtPct } from '@/lib/utils/format'
import clsx from 'clsx'

interface Props { bizKpis: BusinessKpi[] }

export default function ProgressSection({ bizKpis }: Props) {
  return (
    <div className="card h-full">
      <div className="section-title mb-4">📅 事業別計画達成率</div>
      <div className="space-y-4">
        {bizKpis.map(biz => {
          const rate = biz.cum_achieve
          const barColor =
            rate >= 110 ? 'bg-success' : rate >= 100 ? 'bg-info' : rate >= 90 ? 'bg-warning' : 'bg-danger'
          const textColor =
            rate >= 110 ? 'text-success' : rate >= 100 ? 'text-info' : rate >= 90 ? 'text-warning' : 'text-danger'

          return (
            <div key={biz.business.id}>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: biz.business.color }}
                  />
                  <span className="font-semibold text-white">{biz.business.name.split('（')[0]}</span>
                </div>
                <span className={clsx('font-bold', textColor)}>{rate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-bg3 rounded-full h-1.5 overflow-hidden">
                <div
                  className={clsx('h-1.5 rounded-full transition-all duration-500', barColor)}
                  style={{ width: `${Math.min(rate, 130)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted mt-1">
                <span>実績 {fmtMoney(biz.cum_sales)}</span>
                <span>計画 {fmtMoney(biz.cum_plan_sales)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
