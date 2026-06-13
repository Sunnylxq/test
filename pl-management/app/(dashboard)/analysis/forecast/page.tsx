import { createClient } from '@/lib/supabase/server'
import { buildBusinessKpi, buildTotalKpi, forecastYearEnd } from '@/lib/calc/pl'
import { fmtMoney, fmtPct } from '@/lib/utils/format'
import ForecastChart from '@/components/charts/ForecastChart'
import type { Business, PlActual, PlPlan } from '@/types'
import clsx from 'clsx'

const FILLED_IDX = 5
const FISCAL_YEAR = 2025

export default async function ForecastPage() {
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
  const total = buildTotalKpi(bizKpis)
  const totalForecast = forecastYearEnd(total.monthly, FILLED_IDX)

  const fullPlanSales = total.monthly.reduce((a, m) => a + m.plan_sales, 0)
  const fullPlanOp    = total.monthly.reduce((a, m) => a + m.plan_op, 0)
  const achieveForecast = fullPlanSales > 0 ? (totalForecast.sales / fullPlanSales) * 100 : 0

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🔮 年度予測</h1>
          <p className="page-subtitle">直近3ヶ月の平均ペースから{FISCAL_YEAR}年度年末着地を予測</p>
        </div>
      </div>

      {/* 全社予測カード */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <div className="text-xs text-muted font-semibold uppercase tracking-wide mb-2">📊 予測年末売上高</div>
          <div className="text-2xl font-extrabold text-accent">{fmtMoney(totalForecast.sales)}</div>
          <div className="text-xs text-muted mt-1">
            年計画 {fmtMoney(fullPlanSales)}（達成率 {achieveForecast.toFixed(1)}%）
          </div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-muted font-semibold uppercase tracking-wide mb-2">💰 予測年末営業利益</div>
          <div className="text-2xl font-extrabold text-success">{fmtMoney(totalForecast.op)}</div>
          <div className="text-xs text-muted mt-1">年計画 {fmtMoney(fullPlanOp)}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-muted font-semibold uppercase tracking-wide mb-2">📐 予測年末利益率</div>
          <div className="text-2xl font-extrabold text-accent-2">{fmtPct(totalForecast.margin)}</div>
          <div className="text-xs text-muted mt-1">現状ペース継続時の推計</div>
        </div>
      </div>

      {/* 予測チャート */}
      <div className="card mb-6">
        <div className="text-xs font-semibold text-muted mb-4">📊 全社売上予測チャート（実績 + 推計延長）</div>
        <ForecastChart monthly={total.monthly} filledIdx={FILLED_IDX} height={240} />
      </div>

      {/* 事業別予測テーブル */}
      <div className="card">
        <div className="section-title mb-4">🏢 事業別年度着地予測</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted font-semibold">事業</th>
                <th className="text-right py-2 px-3 text-muted font-semibold">予測売上</th>
                <th className="text-right py-2 px-3 text-muted font-semibold">年計画</th>
                <th className="text-right py-2 px-3 text-muted font-semibold">予測達成率</th>
                <th className="text-right py-2 px-3 text-muted font-semibold">予測利益</th>
                <th className="text-right py-2 px-3 text-muted font-semibold">予測利益率</th>
              </tr>
            </thead>
            <tbody>
              {bizKpis.map(biz => {
                const forecast = forecastYearEnd(biz.monthly, FILLED_IDX)
                const planSales = biz.monthly.reduce((a, m) => a + m.plan_sales, 0)
                const achieve   = planSales > 0 ? (forecast.sales / planSales) * 100 : 0
                return (
                  <tr key={biz.business.id} className="border-b border-border/50 hover:bg-bg3/40">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: biz.business.color }} />
                        <span className="font-semibold text-white">{biz.business.name.split('（')[0]}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-3 font-bold text-white">{fmtMoney(forecast.sales)}</td>
                    <td className="text-right py-3 px-3 text-muted">{fmtMoney(planSales)}</td>
                    <td className={clsx('text-right py-3 px-3 font-bold', achieve >= 100 ? 'text-success' : 'text-danger')}>
                      {fmtPct(achieve)}
                    </td>
                    <td className="text-right py-3 px-3 font-bold text-success">{fmtMoney(forecast.op)}</td>
                    <td className="text-right py-3 px-3 text-accent">{fmtPct(forecast.margin)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-xs text-muted">※ 直近3ヶ月平均ペースで残月を推計</div>
      </div>
    </div>
  )
}
