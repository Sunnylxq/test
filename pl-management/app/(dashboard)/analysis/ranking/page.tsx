import { createClient } from '@/lib/supabase/server'
import { buildBusinessKpi } from '@/lib/calc/pl'
import { fmtMoney, fmtPct } from '@/lib/utils/format'
import type { Business, PlActual, PlPlan, BusinessKpi } from '@/types'
import clsx from 'clsx'

const FILLED_IDX = 5
const FISCAL_YEAR = 2025

function RankCard({
  title, icon, bizKpis, getValue, formatValue,
}: {
  title: string; icon: string; bizKpis: BusinessKpi[]
  getValue: (b: BusinessKpi) => number
  formatValue: (v: number) => string
}) {
  const sorted = [...bizKpis].sort((a, b) => getValue(b) - getValue(a))
  const maxVal = getValue(sorted[0]) || 1

  const medalClass = ['text-warning', 'text-subtle', 'text-[#cd7f32]']
  const medalBg    = ['bg-warning/15', 'bg-subtle/15', 'bg-[#cd7f32]/15']

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{icon}</span>
        <span className="section-title">{title}</span>
      </div>
      <div className="space-y-3">
        {sorted.map((biz, i) => {
          const val = getValue(biz)
          const pct = Math.max((val / maxVal) * 100, 2)
          return (
            <div key={biz.business.id} className="flex items-center gap-3">
              <div className={clsx(
                'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0',
                i < 3 ? medalBg[i] : 'bg-bg3',
                i < 3 ? medalClass[i] : 'text-muted',
              )}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white mb-1 truncate">
                  {biz.business.name.split('（')[0]}
                </div>
                <div className="w-full bg-bg3 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: biz.business.color }}
                  />
                </div>
              </div>
              <div className="text-sm font-bold tabular-nums shrink-0" style={{ color: biz.business.color }}>
                {formatValue(val)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default async function RankingPage() {
  const supabase = await createClient()

  const [{ data: businesses }, { data: actuals }, { data: plans }, { data: prevActuals }] = await Promise.all([
    supabase.from('businesses').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('pl_actuals').select('*').eq('fiscal_year', FISCAL_YEAR),
    supabase.from('pl_plans').select('*').eq('fiscal_year', FISCAL_YEAR).eq('version', 1).eq('is_active', true),
    supabase.from('pl_actuals').select('*').eq('fiscal_year', 2024),
  ])

  const bizList = (businesses ?? []) as Business[]
  const bizKpis = bizList.map(biz =>
    buildBusinessKpi(
      biz,
      (actuals ?? []).filter((a: PlActual) => a.business_id === biz.id),
      (plans ?? []).filter((p: PlPlan) => p.business_id === biz.id),
      (prevActuals ?? []).filter((a: PlActual) => a.business_id === biz.id),
      FILLED_IDX
    )
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🏆 事業ランキング</h1>
          <p className="page-subtitle">{FISCAL_YEAR}年度 累計実績による事業パフォーマンス比較</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RankCard
          title="売上高ランキング" icon="💹" bizKpis={bizKpis}
          getValue={b => b.cum_sales}
          formatValue={v => fmtMoney(v)}
        />
        <RankCard
          title="営業利益ランキング" icon="💰" bizKpis={bizKpis}
          getValue={b => b.cum_op}
          formatValue={v => fmtMoney(v)}
        />
        <RankCard
          title="利益率ランキング" icon="📐" bizKpis={bizKpis}
          getValue={b => b.cum_margin}
          formatValue={v => fmtPct(v)}
        />
        <RankCard
          title="成長率ランキング" icon="📈" bizKpis={bizKpis}
          getValue={b => b.cum_yoy}
          formatValue={v => fmtPct(v, true)}
        />
      </div>
    </div>
  )
}
