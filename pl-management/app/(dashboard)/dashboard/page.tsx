import { createClient } from '@/lib/supabase/server'
import { buildBusinessKpi, buildTotalKpi } from '@/lib/calc/pl'
import { fmtMoney, fmtPct, fmtChange } from '@/lib/utils/format'
import { FISCAL_MONTHS } from '@/lib/utils/fiscal'
import KpiCard from '@/components/dashboard/KpiCard'
import SalesTrendChart from '@/components/charts/SalesTrendChart'
import ProfitBarChart from '@/components/charts/ProfitBarChart'
import BusinessPieChart from '@/components/charts/BusinessPieChart'
import MarginLineChart from '@/components/charts/MarginLineChart'
import AlertPanel from '@/components/dashboard/AlertPanel'
import ProgressSection from '@/components/dashboard/ProgressSection'
import type { Business, PlActual, PlPlan, Alert } from '@/types'

const FILLED_IDX = 5 // デモ: 9月まで入力済み
const FISCAL_YEAR = 2025
const PREV_YEAR   = 2024

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { data: businesses },
    { data: actuals },
    { data: plans },
    { data: prevActuals },
    { data: alerts },
  ] = await Promise.all([
    supabase.from('businesses').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('pl_actuals').select('*').eq('fiscal_year', FISCAL_YEAR),
    supabase.from('pl_plans').select('*').eq('fiscal_year', FISCAL_YEAR).eq('version', 1).eq('is_active', true),
    supabase.from('pl_actuals').select('*').eq('fiscal_year', PREV_YEAR),
    supabase.from('alerts').select('*, businesses(name,color)').eq('is_resolved', false).order('created_at', { ascending: false }).limit(5),
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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">ダッシュボード</h1>
          <p className="page-subtitle">
            {FISCAL_YEAR}年度 全社経営サマリー（累計{FILLED_IDX + 1}ヶ月）
          </p>
        </div>
        <a href="/businesses" className="btn-outline text-sm">
          事業一覧 →
        </a>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard
          icon="💹" label="累計売上高" color="blue"
          value={fmtMoney(total.cum_sales)}
          sub={`計画: ${fmtMoney(total.cum_plan_sales)}`}
          change={total.cum_yoy}
          changeLabel={`前年比 ${fmtPct(total.cum_yoy, true)}`}
        />
        <KpiCard
          icon="💰" label="累計営業利益" color="green"
          value={fmtMoney(total.cum_op)}
          sub={`計画: ${fmtMoney(total.cum_plan_op)}`}
          change={total.cum_plan_op > 0 ? (total.cum_op - total.cum_plan_op) / total.cum_plan_op * 100 : 0}
          changeLabel={`計画比 ${fmtPct(total.cum_plan_op > 0 ? (total.cum_op - total.cum_plan_op) / total.cum_plan_op * 100 : 0, true)}`}
        />
        <KpiCard
          icon="📐" label="利益率" color="purple"
          value={fmtPct(total.cum_margin)}
          sub="営業利益率（累計）"
          change={total.cum_margin >= 15 ? 1 : -1}
          changeLabel={total.cum_margin >= 15 ? '良好水準' : '改善余地あり'}
        />
        <KpiCard
          icon="🎯" label="計画達成率" color={total.cum_achieve >= 100 ? 'green' : 'red'}
          value={fmtPct(total.cum_achieve)}
          sub={`累計${FILLED_IDX + 1}ヶ月`}
          change={total.cum_achieve - 100}
          changeLabel={total.cum_achieve >= 100 ? '計画達成中' : '計画未達'}
        />
        <KpiCard
          icon="📈" label="前年同期比" color={total.cum_yoy >= 0 ? 'cyan' : 'red'}
          value={fmtPct(total.cum_yoy, true)}
          sub={`前年: ${fmtMoney(total.cum_prev_sales)}`}
          change={total.cum_yoy}
          changeLabel={total.cum_yoy >= 0 ? '成長中' : '前年割れ'}
        />
      </div>

      {/* 進捗バー + アラート */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <ProgressSection bizKpis={bizKpis} />
        </div>
        <div>
          <AlertPanel alerts={(alerts ?? []) as Alert[]} />
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="card">
          <div className="text-xs font-semibold text-muted mb-4">📊 月次売上推移（全社）</div>
          <SalesTrendChart data={total.monthly} filledIdx={FILLED_IDX} />
        </div>
        <div className="card">
          <div className="text-xs font-semibold text-muted mb-4">💰 月次営業利益推移（全社）</div>
          <ProfitBarChart data={total.monthly} filledIdx={FILLED_IDX} />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="text-xs font-semibold text-muted mb-4">🥧 事業別売上構成（累計）</div>
          <BusinessPieChart data={bizKpis} height={220} />
        </div>
        <div className="card">
          <div className="text-xs font-semibold text-muted mb-4">📉 利益率推移（事業別）</div>
          <MarginLineChart bizKpis={bizKpis} filledIdx={FILLED_IDX} height={220} />
        </div>
      </div>
    </div>
  )
}
