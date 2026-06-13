import type { PlActual, PlPlan, PlMonthValues, MonthlyKpi, BusinessKpi, TotalKpi } from '@/types'
import { FISCAL_MONTH_NUMBERS, monthToFiscalIndex } from '@/lib/utils/fiscal'

export function computeMonthValues(row: PlActual | PlPlan): PlMonthValues {
  const sg_total = row.sg_personnel + row.sg_marketing + row.sg_other
  const gross_profit = row.sales - row.cogs
  const operating_profit = gross_profit - sg_total
  const op_margin = row.sales > 0 ? (operating_profit / row.sales) * 100 : 0
  return { sales: row.sales, cogs: row.cogs, sg_total, gross_profit, operating_profit, op_margin }
}

export function buildMonthlyKpi(
  actuals: PlActual[],
  plans: PlPlan[],
  prevActuals: PlActual[]
): MonthlyKpi[] {
  return FISCAL_MONTH_NUMBERS.map(month => {
    const a = actuals.find(r => r.month === month)
    const p = plans.find(r => r.month === month)
    const pv = prevActuals.find(r => r.month === month)

    const av = a ? computeMonthValues(a) : null
    const pv2 = p ? computeMonthValues(p) : null
    const pvv = pv ? computeMonthValues(pv) : null

    const actual_sales = av?.sales ?? 0
    const plan_sales   = pv2?.sales ?? 0
    const prev_sales   = pvv?.sales ?? 0
    const actual_op    = av?.operating_profit ?? 0
    const plan_op      = pv2?.operating_profit ?? 0
    const prev_op      = pvv?.operating_profit ?? 0

    return {
      month,
      actual_sales,
      plan_sales,
      prev_sales,
      actual_op,
      plan_op,
      prev_op,
      op_margin:    actual_sales > 0 ? (actual_op / actual_sales) * 100 : 0,
      achieve_rate: plan_sales > 0 ? (actual_sales / plan_sales) * 100 : 0,
      yoy_sales:    prev_sales > 0 ? ((actual_sales - prev_sales) / prev_sales) * 100 : 0,
    }
  })
}

export function buildBusinessKpi(
  business: { id: string; name: string; color: string; code: string; company_id: string; sort_order: number; is_active: boolean; created_at: string },
  actuals: PlActual[],
  plans: PlPlan[],
  prevActuals: PlActual[],
  filledMonthIdx: number
): BusinessKpi {
  const monthly = buildMonthlyKpi(actuals, plans, prevActuals)
  const filled  = monthly.slice(0, filledMonthIdx + 1).filter(m => m.actual_sales > 0)

  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)

  const cum_sales      = sum(filled.map(m => m.actual_sales))
  const cum_plan_sales = sum(filled.map(m => m.plan_sales))
  const cum_prev_sales = sum(filled.map(m => m.prev_sales))
  const cum_op         = sum(filled.map(m => m.actual_op))
  const cum_plan_op    = sum(filled.map(m => m.plan_op))
  const cum_prev_op    = sum(filled.map(m => m.prev_op))

  return {
    business,
    cum_sales,
    cum_plan_sales,
    cum_prev_sales,
    cum_op,
    cum_plan_op,
    cum_prev_op,
    cum_margin:  cum_sales > 0 ? (cum_op / cum_sales) * 100 : 0,
    cum_achieve: cum_plan_sales > 0 ? (cum_sales / cum_plan_sales) * 100 : 0,
    cum_yoy:     cum_prev_sales > 0 ? ((cum_sales - cum_prev_sales) / cum_prev_sales) * 100 : 0,
    monthly,
  }
}

export function buildTotalKpi(bizKpis: BusinessKpi[]): TotalKpi {
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)
  const MONTHS = 12

  const cum_sales      = sum(bizKpis.map(b => b.cum_sales))
  const cum_plan_sales = sum(bizKpis.map(b => b.cum_plan_sales))
  const cum_prev_sales = sum(bizKpis.map(b => b.cum_prev_sales))
  const cum_op         = sum(bizKpis.map(b => b.cum_op))
  const cum_plan_op    = sum(bizKpis.map(b => b.cum_plan_op))

  const monthly: MonthlyKpi[] = Array.from({ length: MONTHS }, (_, i) => {
    const month = FISCAL_MONTH_NUMBERS[i]
    const ms = bizKpis.map(b => b.monthly[i])
    const actual_sales = sum(ms.map(m => m.actual_sales))
    const plan_sales   = sum(ms.map(m => m.plan_sales))
    const prev_sales   = sum(ms.map(m => m.prev_sales))
    const actual_op    = sum(ms.map(m => m.actual_op))
    const plan_op      = sum(ms.map(m => m.plan_op))
    const prev_op      = sum(ms.map(m => m.prev_op))
    return {
      month, actual_sales, plan_sales, prev_sales, actual_op, plan_op, prev_op,
      op_margin:    actual_sales > 0 ? (actual_op / actual_sales) * 100 : 0,
      achieve_rate: plan_sales > 0 ? (actual_sales / plan_sales) * 100 : 0,
      yoy_sales:    prev_sales > 0 ? ((actual_sales - prev_sales) / prev_sales) * 100 : 0,
    }
  })

  return {
    cum_sales, cum_plan_sales, cum_prev_sales, cum_op, cum_plan_op,
    cum_margin:  cum_sales > 0 ? (cum_op / cum_sales) * 100 : 0,
    cum_achieve: cum_plan_sales > 0 ? (cum_sales / cum_plan_sales) * 100 : 0,
    cum_yoy:     cum_prev_sales > 0 ? ((cum_sales - cum_prev_sales) / cum_prev_sales) * 100 : 0,
    monthly,
  }
}

// 直近N月平均で年末着地予測
export function forecastYearEnd(monthly: MonthlyKpi[], filledIdx: number, lookback = 3) {
  const filled = monthly.slice(0, filledIdx + 1).filter(m => m.actual_sales > 0)
  const recent = filled.slice(-lookback)
  if (recent.length === 0) return { sales: 0, op: 0, margin: 0 }

  const avgSales = recent.reduce((a, m) => a + m.actual_sales, 0) / recent.length
  const avgOp    = recent.reduce((a, m) => a + m.actual_op, 0) / recent.length
  const remaining = 12 - filled.length

  const cumSales = filled.reduce((a, m) => a + m.actual_sales, 0)
  const cumOp    = filled.reduce((a, m) => a + m.actual_op, 0)

  const totalSales = cumSales + avgSales * remaining
  const totalOp    = cumOp   + avgOp   * remaining
  return {
    sales:  totalSales,
    op:     totalOp,
    margin: totalSales > 0 ? (totalOp / totalSales) * 100 : 0,
  }
}
