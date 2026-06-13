import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UserManagement from '@/components/admin/UserManagement'
import type { UserProfile, Business } from '@/types'

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
  if (profile?.global_role !== 'admin') redirect('/dashboard')

  const [{ data: users }, { data: businesses }, { data: accesses }] = await Promise.all([
    supabase.from('user_profiles').select('*').order('created_at'),
    supabase.from('businesses').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('user_business_access').select('*'),
  ])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">👥 ユーザー管理</h1>
          <p className="page-subtitle">ユーザーと事業へのアクセス権を管理します</p>
        </div>
      </div>
      <UserManagement
        users={(users ?? []) as UserProfile[]}
        businesses={(businesses ?? []) as Business[]}
        accesses={accesses ?? []}
      />
    </div>
  )
}
