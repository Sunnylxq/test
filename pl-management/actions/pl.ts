'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { PlUpsertInput, PlPlanUpsertInput } from '@/types'

export async function upsertPlActual(input: PlUpsertInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('pl_actuals').upsert({
    ...input,
    input_by: user.id,
    status: 'draft',
  }, { onConflict: 'business_id,fiscal_year,month' })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
  revalidatePath(`/businesses/${input.business_id}`)
  revalidatePath(`/businesses/${input.business_id}/pl`)
}

export async function upsertPlPlan(input: PlPlanUpsertInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('pl_plans').upsert({
    ...input,
    version: input.version ?? 1,
    created_by: user.id,
    is_active: true,
  }, { onConflict: 'business_id,fiscal_year,month,version' })

  if (error) throw new Error(error.message)

  revalidatePath(`/businesses/${input.business_id}/pl`)
}

export async function approvePlActual(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('pl_actuals').update({
    status: 'approved',
    approved_by: user.id,
    approved_at: new Date().toISOString(),
  }).eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}

export async function getPlActuals(businessId: string, fiscalYear: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pl_actuals')
    .select('*')
    .eq('business_id', businessId)
    .eq('fiscal_year', fiscalYear)
    .order('month')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getPlPlans(businessId: string, fiscalYear: number, version = 1) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pl_plans')
    .select('*')
    .eq('business_id', businessId)
    .eq('fiscal_year', fiscalYear)
    .eq('version', version)
    .eq('is_active', true)
    .order('month')
  if (error) throw new Error(error.message)
  return data ?? []
}
