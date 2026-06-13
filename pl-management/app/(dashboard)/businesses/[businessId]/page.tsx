import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { buildBusinessKpi } from '@/lib/calc/pl'
import { fmtMoney, fmtPct } from '@/lib/utils/format'
import Link from 'next/link'
import clsx from 'clsx'
import SalesTrendChart from '@/components/charts/SalesTrendChart'
import ProfitBarChart from '@/components/charts/ProfitBarChart'
import KpiCard from '@/components/dashboard/KpiCard'
import type { Business, PlActual, PlPlan } from '@/types'
import { FISCAL_MONTHS, FISCAL_MONTH_NUMBERS } from '@/lib/utils/fiscal'

const FILLED_IDX = 5
const FISCAL_YEAR = 2025

export default async function BusinessDetailPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params
  const supabase = await createClient()

  const [{ data: biz }, { data: actuals }, { data: plans }, { data: prevActuals }] = await Promise.all([
    supabase.from('businesses').select('*').eq('id', businessId).single(),
    supabase.from('pl_actuals').select('*').eq('business_id', businessId).eq('fiscal_year', FISCAL_YEAR),
    supabase.from('pl_plans').select('*').eq('business_id', businessId).eq('fiscal_year', FISCAL_YEAR).eq('version', 1).eq('is_active', true),
    supabase.from('pl_actuals').select('*').eq('business_id', businessId).eq('fiscal_year', 2024),
  ])

  if (!biz) notFound()

  const kpi = buildBusinessKpi(
    biz as Business,
    (actuals ?? []) as PlActual[],
    (plans ?? []) as PlPlan[],
    (prevActuals ?? []) as PlActual[],
    FILLED_IDX
  )

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: biz.color + '22' }}>🏢</div>
          <div>
            <h1 className="page-title">{biz.name}</h1>
            <p className="page-subtitle">{FISCAL_YEAR}年度 経営サマリー</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/businesses/${businessId}/pl`} className="btn-primary">✏️ PL入力</Link>
          <Link href="/businesses" className="btn-outline">← 戻る</Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon="💹" label="累計売上高" color="blue"
          value={fmtMoney(kpi.cum_sales)}
          sub={`計画: ${fmtMoney(kpi.cum_plan_sales)}`}
          change={kpi.cum_yoy} changeLabel={`前年比 ${fmtPct(kpi.cum_yoy, true)}`} />
        <KpiCard icon="💰" label="累計営業利益" color="green"
          value={fmtMoney(kpi.cum_op)}
          sub={`計画: ${fmtMoney(kpi.cum_plan_op)}`}
          change={kpi.cum_plan_op > 0 ? (kpi.cum_op - kpi.cum_plan_op) / kpi.cum_plan_op * 100 : 0} />
        <KpiCard icon="📐" label="利益率" color="purple"
          value={fmtPct(kpi.cum_margin)}
          sub="営業利益率（累計）" />
        <KpiCard icon="🎯" label="計画達成率" color={kpi.cum_achieve >= 100 ? 'green' : 'red'}
          value={fmtPct(kpi.cum_achieve)}
          sub={`前年比 ${fmtPct(kpi.cum_yoy, true)}`}
          change={kpi.cum_achieve - 100}
          changeLabel={kpi.cum_achieve >= 100 ? '達成中' : '未達'} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="card">
          <div className="text-xs font-semibold text-muted mb-4">📊 月次売上推移</div>
          <SalesTrendChart data={kpi.monthly} filledIdx={FILLED_IDX} color={biz.color} />
        </div>
        <div className="card">
          <div className="text-xs font-semibold text-muted mb-4">💰 月次営業利益推移</div>
          <ProfitBarChart data={kpi.monthly} filledIdx={FILLED_IDX} color={biz.color} />
        </div>
      </div>

      {/* PL概要テーブル */}
      <div className="card">
        <div className="section-title mb-4">📋 PL月次サマリー</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted font-semibold">項目</th>
                {FISCAL_MONTHS.slice(0, FILLED_IDX + 1).map(m => (
                  <th key={m} className="text-right py-2 px-2 text-muted font-semibold">{m}</th>
                ))}
                <th className="text-right py-2 px-2 text-muted font-semibold">累計</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: '売上高', key: 'actual_sales' as const, cls: 'text-white font-semibold' },
                { label: '営業利益', key: 'actual_op' as const, cls: 'text-success font-semibold' },
                { label: '利益率%', key: 'op_margin' as const, cls: 'text-accent', fmt: (v: number) => v.toFixed(1) + '%' },
                { label: '達成率%', key: 'achieve_rate' as const, cls: '', fmt: (v: number) => v.toFixed(1) + '%' },
              ].map(row => (
                <tr key={row.label} className="border-b border-border/50 hover:bg-bg3/50">
                  <td className="py-2 pr-4 text-muted">{row.label}</td>
                  {kpi.monthly.slice(0, FILLED_IDX + 1).map((m, i) => {
                    const v = m[row.key]
                    const formatted = row.fmt ? row.fmt(v) : `¥${Math.round(v).toLocaleString()}M`
                    return (
                      <td key={i} className={clsx('text-right py-2 px-2', row.cls)}>
                        {v !== 0 ? formatted : '—'}
                      </td>
                    )
                  })}
                  <td className={clsx('text-right py-2 px-2 font-bold', row.cls)}>
                    {row.key === 'actual_sales' ? `¥${Math.round(kpi.cum_sales).toLocaleString()}M`
                      : row.key === 'actual_op' ? `¥${Math.round(kpi.cum_op).toLocaleString()}M`
                      : row.key === 'op_margin' ? kpi.cum_margin.toFixed(1) + '%'
                      : kpi.cum_achieve.toFixed(1) + '%'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
