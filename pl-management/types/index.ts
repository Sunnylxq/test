export type GlobalRole = 'admin' | 'editor' | 'viewer'
export type AlertSeverity = 'red' | 'yellow' | 'green'
export type PlStatus = 'draft' | 'submitted' | 'approved'
export type BudgetStatus = 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected'

export interface Company {
  id: string
  name: string
  fiscal_month: number
  currency: string
  created_at: string
}

export interface Business {
  id: string
  company_id: string
  name: string
  code: string
  color: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface UserProfile {
  id: string
  company_id: string
  full_name: string
  avatar_url?: string
  global_role: GlobalRole
  is_active: boolean
  created_at: string
}

export interface UserBusinessAccess {
  id: string
  user_id: string
  business_id: string
  role: GlobalRole
  granted_at: string
}

export interface PlActual {
  id: string
  business_id: string
  fiscal_year: number
  month: number
  sales: number
  cogs: number
  sg_personnel: number
  sg_marketing: number
  sg_other: number
  status: PlStatus
  input_by?: string
  approved_by?: string
  approved_at?: string
  note?: string
  created_at: string
  updated_at: string
}

export interface PlPlan {
  id: string
  business_id: string
  fiscal_year: number
  month: number
  version: number
  sales: number
  cogs: number
  sg_personnel: number
  sg_marketing: number
  sg_other: number
  is_active: boolean
  created_at: string
}

export interface PlComputed {
  month: number
  actual: PlMonthValues | null
  plan: PlMonthValues | null
  prev: PlMonthValues | null
  diff_sales: number
  diff_op: number
  achieve_rate: number
  yoy_sales: number
  yoy_op: number
}

export interface PlMonthValues {
  sales: number
  cogs: number
  sg_total: number
  gross_profit: number
  operating_profit: number
  op_margin: number
}

export interface Budget {
  id: string
  business_id: string
  fiscal_year: number
  version: number
  label?: string
  status: BudgetStatus
  submitted_by?: string
  submitted_at?: string
  created_at: string
  updated_at: string
}

export interface BudgetItem {
  id: string
  budget_id: string
  month: number
  sales: number
  cogs: number
  sg_personnel: number
  sg_marketing: number
  sg_other: number
}

export interface Alert {
  id: string
  business_id: string
  alert_type: string
  severity: AlertSeverity
  title: string
  description?: string
  fiscal_year?: number
  month?: number
  threshold_value?: number
  actual_value?: number
  is_resolved: boolean
  resolved_by?: string
  resolved_at?: string
  created_at: string
  businesses?: { name: string; color: string }
}

export interface KpiSnapshot {
  business_id: string
  fiscal_year: number
  month: number
  cum_sales: number
  cum_plan_sales: number
  cum_op: number
  cum_plan_op: number
  cum_margin: number
  cum_achieve: number
  cum_yoy: number
}

// 計算結果
export interface BusinessKpi {
  business: Business
  cum_sales: number
  cum_plan_sales: number
  cum_prev_sales: number
  cum_op: number
  cum_plan_op: number
  cum_prev_op: number
  cum_margin: number
  cum_achieve: number
  cum_yoy: number
  monthly: MonthlyKpi[]
}

export interface MonthlyKpi {
  month: number
  actual_sales: number
  plan_sales: number
  prev_sales: number
  actual_op: number
  plan_op: number
  prev_op: number
  op_margin: number
  achieve_rate: number
  yoy_sales: number
}

export interface TotalKpi {
  cum_sales: number
  cum_plan_sales: number
  cum_prev_sales: number
  cum_op: number
  cum_plan_op: number
  cum_margin: number
  cum_achieve: number
  cum_yoy: number
  monthly: MonthlyKpi[]
}

export interface PlUpsertInput {
  business_id: string
  fiscal_year: number
  month: number
  sales: number
  cogs: number
  sg_personnel: number
  sg_marketing: number
  sg_other: number
  note?: string
}

export interface PlPlanUpsertInput extends PlUpsertInput {
  version?: number
}
