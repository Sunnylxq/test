import { createClient } from '@/lib/supabase/server'
import { buildBusinessKpi } from '@/lib/calc/pl'
import { evaluateAlerts } from '@/lib/calc/alerts'
import AlertList from '@/components/analysis/AlertList'
import type { Business, PlActual, PlPlan } from '@/types'

const FILLED_IDX = 5
const FISCAL_YEAR = 2025

export default async function AlertsPage() {
  const supabase = await createClient()

  const [{ data: businesses }, { data: actuals }, { data: plans }, { data: prevActuals }, { data: dbAlerts }] = await Promise.all([
    supabase.from('businesses').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('pl_actuals').select('*').eq('fiscal_year', FISCAL_YEAR),
    supabase.from('pl_plans').select('*').eq('fiscal_year', FISCAL_YEAR).eq('version', 1).eq('is_active', true),
    supabase.from('pl_actuals').select('*').eq('fiscal_year', 2024),
    supabase.from('alerts').select('*, businesses(name,color)').order('created_at', { ascending: false }),
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

  // ライブ評価アラート（DBにない場合のフォールバック）
  const liveAlerts = evaluateAlerts(bizKpis, FILLED_IDX)
  const liveWithBiz = liveAlerts.map(a => ({
    ...a,
    id: Math.random().toString(36).slice(2),
    created_at: new Date().toISOString(),
    businesses: bizList.find(b => b.id === a.business_id)
      ? { name: bizList.find(b => b.id === a.business_id)!.name, color: bizList.find(b => b.id === a.business_id)!.color }
      : undefined,
  }))

  const alerts = dbAlerts?.length ? dbAlerts : liveWithBiz

  const red    = alerts.filter(a => a.severity === 'red' && !a.is_resolved)
  const yellow = alerts.filter(a => a.severity === 'yellow' && !a.is_resolved)
  const green  = alerts.filter(a => a.severity === 'green' && !a.is_resolved)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🔔 アラート＆経営提示</h1>
          <p className="page-subtitle">自動検知された異常・注意事項 — {FISCAL_YEAR}年度</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card border-danger/30 text-center">
          <div className="text-2xl font-extrabold text-danger">{red.length}</div>
          <div className="text-xs text-muted mt-1">🔴 緊急アラート</div>
        </div>
        <div className="card border-warning/30 text-center">
          <div className="text-2xl font-extrabold text-warning">{yellow.length}</div>
          <div className="text-xs text-muted mt-1">🟡 注意アラート</div>
        </div>
        <div className="card border-success/30 text-center">
          <div className="text-2xl font-extrabold text-success">{green.length}</div>
          <div className="text-xs text-muted mt-1">🟢 Good News</div>
        </div>
      </div>

      <AlertList alerts={alerts as any} />
    </div>
  )
}
