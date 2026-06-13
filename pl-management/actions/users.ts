'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { GlobalRole } from '@/types'

export async function updateUserRole(userId: string, businessId: string, role: GlobalRole) {
  const supabase = await createClient()
  const { error } = await supabase.from('user_business_access').upsert({
    user_id: userId,
    business_id: businessId,
    role,
  }, { onConflict: 'user_id,business_id' })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/users')
}

export async function updateGlobalRole(userId: string, role: GlobalRole) {
  const supabase = await createClient()
  const { error } = await supabase.from('user_profiles').update({ global_role: role }).eq('id', userId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/users')
}

export async function deactivateUser(userId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('user_profiles').update({ is_active: false }).eq('id', userId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/users')
}

export async function activateUser(userId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('user_profiles').update({ is_active: true }).eq('id', userId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/users')
}
