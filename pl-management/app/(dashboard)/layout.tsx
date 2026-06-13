import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import type { Business, UserProfile } from '@/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: businesses }, { data: alerts }] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    supabase.from('businesses').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('alerts').select('id').eq('is_resolved', false).eq('severity', 'red'),
  ])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar alertCount={alerts?.length ?? 0} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={profile as UserProfile} businesses={(businesses as Business[]) ?? []} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
