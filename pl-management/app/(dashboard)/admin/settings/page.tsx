import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Business } from '@/types'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
  if (profile?.global_role !== 'admin') redirect('/dashboard')

  const { data: businesses } = await supabase.from('businesses').select('*').order('sort_order')

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ システム設定</h1>
          <p className="page-subtitle">事業設定・アラート閾値・表示設定</p>
        </div>
      </div>

      {/* 事業一覧 */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="section-title">🏢 事業管理</div>
        </div>
        <div className="space-y-2">
          {((businesses ?? []) as Business[]).map(biz => (
            <div key={biz.id} className="flex items-center gap-3 p-3 bg-bg3 rounded-lg">
              <div className="w-5 h-5 rounded" style={{ background: biz.color }} />
              <span className="text-sm font-semibold text-white flex-1">{biz.name}</span>
              <span className="text-xs text-muted">{biz.code}</span>
              <span className={clsx('text-xs font-semibold', biz.is_active ? 'text-success' : 'text-muted')}>
                {biz.is_active ? '有効' : '停止'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* アラート閾値 */}
      <div className="card">
        <div className="section-title mb-4">⚠️ アラート閾値</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: '🔴 売上計画乖離率（%）', defaultVal: '10', desc: 'この%以上未達でRedアラート' },
            { label: '🟡 利益率連続低下月数', defaultVal: '3', desc: 'N月連続低下でYellowアラート' },
            { label: '🟢 達成率超過閾値（%）', defaultVal: '110', desc: 'この%以上でGreenアラート' },
          ].map(item => (
            <div key={item.label}>
              <label className="block text-xs font-semibold text-subtle mb-1.5">{item.label}</label>
              <input type="number" defaultValue={item.defaultVal} className="input-field" />
              <div className="text-[11px] text-muted mt-1">{item.desc}</div>
            </div>
          ))}
        </div>
        <button className="btn-primary mt-4 text-sm">設定を保存</button>
      </div>
    </div>
  )
}

// clsx は直接使えないのでimport
import clsx from 'clsx'
