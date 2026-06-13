import type { BusinessKpi, Alert } from '@/types'
import { FISCAL_MONTH_NUMBERS } from '@/lib/utils/fiscal'

interface AlertConfig {
  salesMissPct: number      // 売上未達アラート閾値
  marginDeclineMonths: number // 利益率連続低下月数
  overachievePct: number    // 超過達成アラート閾値
  yoyDeclinePct: number     // 前年割れアラート閾値
}

const DEFAULT_CONFIG: AlertConfig = {
  salesMissPct: 10,
  marginDeclineMonths: 3,
  overachievePct: 110,
  yoyDeclinePct: 5,
}

export function evaluateAlerts(
  bizKpis: BusinessKpi[],
  filledIdx: number,
  config: AlertConfig = DEFAULT_CONFIG
): Omit<Alert, 'id' | 'created_at'>[] {
  const alerts: Omit<Alert, 'id' | 'created_at'>[] = []
  const now = new Date()

  for (const biz of bizKpis) {
    const bizId = biz.business.id
    const filledMonthly = biz.monthly.slice(0, filledIdx + 1).filter(m => m.actual_sales > 0)
    if (filledMonthly.length === 0) continue

    const latestMonth = filledMonthly[filledMonthly.length - 1]

    // 🔴 売上計画未達
    if (biz.cum_achieve < 100 - config.salesMissPct) {
      alerts.push({
        business_id: bizId,
        alert_type: 'sales_miss',
        severity: 'red',
        title: `${biz.business.name} — 売上が計画を大幅に下回っています`,
        description: `計画対比 ${(biz.cum_achieve - 100).toFixed(1)}%（累計実績 ¥${Math.round(biz.cum_sales)}M / 計画 ¥${Math.round(biz.cum_plan_sales)}M）`,
        fiscal_year: now.getFullYear(),
        month: latestMonth.month,
        threshold_value: 100 - config.salesMissPct,
        actual_value: biz.cum_achieve,
        is_resolved: false,
      })
    }

    // 🟢 達成率超過
    if (biz.cum_achieve >= config.overachievePct) {
      alerts.push({
        business_id: bizId,
        alert_type: 'overachieve',
        severity: 'green',
        title: `${biz.business.name} — 計画を大きく超過達成！`,
        description: `達成率 ${biz.cum_achieve.toFixed(1)}%（実績 ¥${Math.round(biz.cum_sales)}M / 計画 ¥${Math.round(biz.cum_plan_sales)}M）`,
        fiscal_year: now.getFullYear(),
        month: latestMonth.month,
        threshold_value: config.overachievePct,
        actual_value: biz.cum_achieve,
        is_resolved: false,
      })
    }

    // 🟡 利益率連続低下
    const margins = filledMonthly.map(m => m.op_margin)
    let declineCount = 0
    let maxDecline = 0
    for (let i = 1; i < margins.length; i++) {
      if (margins[i] < margins[i - 1]) { declineCount++; maxDecline = Math.max(maxDecline, declineCount) }
      else declineCount = 0
    }
    if (maxDecline >= config.marginDeclineMonths) {
      alerts.push({
        business_id: bizId,
        alert_type: 'margin_decline',
        severity: 'yellow',
        title: `${biz.business.name} — 利益率が${maxDecline}ヶ月連続で低下`,
        description: `現在の利益率: ${margins[margins.length - 1].toFixed(1)}%。コスト構造の見直しを推奨します。`,
        fiscal_year: now.getFullYear(),
        month: latestMonth.month,
        threshold_value: config.marginDeclineMonths,
        actual_value: maxDecline,
        is_resolved: false,
      })
    }

    // 🔴 前年割れ
    if (biz.cum_yoy < -config.yoyDeclinePct) {
      alerts.push({
        business_id: bizId,
        alert_type: 'yoy_decline',
        severity: 'red',
        title: `${biz.business.name} — 前年同期比 ${biz.cum_yoy.toFixed(1)}% と大幅減少`,
        description: `前年: ¥${Math.round(biz.cum_prev_sales)}M → 今年: ¥${Math.round(biz.cum_sales)}M`,
        fiscal_year: now.getFullYear(),
        month: latestMonth.month,
        threshold_value: -config.yoyDeclinePct,
        actual_value: biz.cum_yoy,
        is_resolved: false,
      })
    }
  }

  return alerts
}
