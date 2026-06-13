import { createClient } from '@/lib/supabase/server'
import { buildBusinessKpi } from '@/lib/calc/pl'
import { fmtMoney, fmtPct } from '@/lib/utils/format'
import Link from 'next/link'
import clsx from 'clsx'
import type { Business, PlActual, PlPlan } from '@/types'

const FILLED_IDX = 5
const FISCAL_YEAR = 2025

export default async function BusinessesPage() {
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
          <h1 className="page-title">事業管理</h1>
          <p className="page-subtitle">{FISCAL_YEAR}年度 全事業一覧</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
        {bizKpis.map(biz => {
          const achieve = biz.cum_achieve
          const achieveColor =
            achieve >= 110 ? 'text-success' : achieve >= 100 ? 'text-info' : achieve >= 90 ? 'text-warning' : 'text-danger'
          const barColor =
            achieve >= 110 ? 'bg-success' : achieve >= 100 ? 'bg-info' : achieve >= 90 ? 'bg-warning' : 'bg-danger'

          return (
            <Link
              key={biz.business.id}
              href={`/businesses/${biz.business.id}`}
              className="card-hover block group"
            >
              {/* 上部カラーバー */}
              <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-card" style={{ background: biz.business.color }} />

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: biz.business.color + '22' }}>
                    🏢
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">{biz.business.name}</div>
                    <div className="text-[11px] text-muted">{biz.business.code}</div>
                  </div>
                </div>
                <div className={clsx('text-sm font-bold', achieveColor)}>
                  {achieve.toFixed(1)}%
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <div className="text-[10px] text-muted mb-0.5">累計売上</div>
                  <div className="text-sm font-bold text-white">{fmtMoney(biz.cum_sales)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted mb-0.5">営業利益</div>
                  <div className="text-sm font-bold text-success">{fmtMoney(biz.cum_op)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted mb-0.5">利益率</div>
                  <div className="text-sm font-bold text-accent">{fmtPct(biz.cum_margin)}</div>
                </div>
              </div>

              {/* 達成率バー */}
              <div>
                <div className="flex justify-between text-[11px] text-muted mb-1">
                  <span>計画達成率</span>
                  <span className={achieveColor}>{achieve.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-bg3 rounded-full h-1.5">
                  <div
                    className={clsx('h-1.5 rounded-full transition-all', barColor)}
                    style={{ width: `${Math.min(achieve, 130)}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
                <span>前年比 <span className={biz.cum_yoy >= 0 ? 'text-success' : 'text-danger'}>
                  {biz.cum_yoy >= 0 ? '▲' : '▼'} {Math.abs(biz.cum_yoy).toFixed(1)}%
                </span></span>
                <span className="text-accent group-hover:underline">詳細 →</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
