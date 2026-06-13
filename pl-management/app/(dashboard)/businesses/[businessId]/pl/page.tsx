import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PlInputTable from '@/components/pl/PlInputTable'
import type { Business, PlActual, PlPlan } from '@/types'

const FISCAL_YEAR = 2025

export default async function PlPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params
  const supabase = await createClient()

  const [{ data: biz }, { data: actuals }, { data: plans }, { data: user }] = await Promise.all([
    supabase.from('businesses').select('*').eq('id', businessId).single(),
    supabase.from('pl_actuals').select('*').eq('business_id', businessId).eq('fiscal_year', FISCAL_YEAR).order('month'),
    supabase.from('pl_plans').select('*').eq('business_id', businessId).eq('fiscal_year', FISCAL_YEAR).eq('version', 1).eq('is_active', true).order('month'),
    supabase.auth.getUser(),
  ])

  if (!biz) notFound()

  // 権限チェック
  const userId = user.user?.id
  const { data: access } = await supabase
    .from('user_business_access')
    .select('role')
    .eq('user_id', userId!)
    .eq('business_id', businessId)
    .single()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('global_role')
    .eq('id', userId!)
    .single()

  const canEdit = profile?.global_role === 'admin' || ['admin', 'editor'].includes(access?.role ?? '')

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">PL データ入力</h1>
          <p className="page-subtitle">{biz.name} — {FISCAL_YEAR}年度</p>
        </div>
        <a href={`/businesses/${businessId}`} className="btn-outline">← 戻る</a>
      </div>

      <PlInputTable
        business={biz as Business}
        fiscalYear={FISCAL_YEAR}
        actuals={(actuals ?? []) as PlActual[]}
        plans={(plans ?? []) as PlPlan[]}
        canEdit={canEdit}
      />
    </div>
  )
}
