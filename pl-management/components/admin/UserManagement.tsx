'use client'

import { useState } from 'react'
import { updateGlobalRole, deactivateUser, activateUser } from '@/actions/users'
import type { UserProfile, Business, GlobalRole, UserBusinessAccess } from '@/types'
import clsx from 'clsx'

interface Props {
  users: UserProfile[]
  businesses: Business[]
  accesses: UserBusinessAccess[]
}

const roleConfig: Record<GlobalRole, { label: string; cls: string }> = {
  admin:  { label: 'Admin',  cls: 'badge-red' },
  editor: { label: 'Editor', cls: 'badge-yellow' },
  viewer: { label: 'Viewer', cls: 'badge-blue' },
}

export default function UserManagement({ users: initialUsers, businesses, accesses }: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<GlobalRole | 'all'>('all')
  const [loading, setLoading] = useState<string | null>(null)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q || u.full_name.toLowerCase().includes(q)
    const matchRole = roleFilter === 'all' || u.global_role === roleFilter
    return matchSearch && matchRole
  })

  async function handleRoleChange(userId: string, role: GlobalRole) {
    setLoading(userId)
    try {
      await updateGlobalRole(userId, role)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, global_role: role } : u))
    } finally { setLoading(null) }
  }

  async function handleToggleActive(user: UserProfile) {
    setLoading(user.id)
    try {
      if (user.is_active) await deactivateUser(user.id)
      else await activateUser(user.id)
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u))
    } finally { setLoading(null) }
  }

  function getUserAccesses(userId: string) {
    return accesses.filter(a => a.user_id === userId)
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '全ユーザー', value: users.length, cls: 'text-white' },
          { label: 'アクティブ', value: users.filter(u => u.is_active).length, cls: 'text-success' },
          { label: 'Admin', value: users.filter(u => u.global_role === 'admin').length, cls: 'text-danger' },
          { label: '停止中', value: users.filter(u => !u.is_active).length, cls: 'text-muted' },
        ].map(s => (
          <div key={s.label} className="card text-center py-3">
            <div className={clsx('text-xl font-extrabold', s.cls)}>{s.value}</div>
            <div className="text-xs text-muted mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card flex items-center gap-3 py-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 名前で検索..."
          className="input-field flex-1 max-w-xs"
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value as any)}
          className="input-field w-36"
        >
          <option value="all">全役割</option>
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
        <div className="text-xs text-muted ml-auto">{filtered.length}件</div>
      </div>

      {/* User List */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-bg3 border-b border-border">
              <th className="text-left py-3 px-4 text-muted font-semibold">ユーザー</th>
              <th className="text-left py-3 px-4 text-muted font-semibold">役割</th>
              <th className="text-left py-3 px-4 text-muted font-semibold hidden md:table-cell">アクセス事業数</th>
              <th className="text-left py-3 px-4 text-muted font-semibold hidden lg:table-cell">ステータス</th>
              <th className="text-right py-3 px-4 text-muted font-semibold">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => {
              const rc = roleConfig[u.global_role]
              const userAccesses = getUserAccesses(u.id)
              const isExpanded = expandedUser === u.id
              return (
                <>
                  <tr
                    key={u.id}
                    className={clsx(
                      'border-b border-border/50 hover:bg-bg3/40 cursor-pointer',
                      !u.is_active && 'opacity-50'
                    )}
                    onClick={() => setExpandedUser(isExpanded ? null : u.id)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={clsx(
                          'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                          u.is_active ? 'bg-accent/20 text-accent' : 'bg-bg3 text-muted'
                        )}>
                          {u.full_name[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{u.full_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={rc.cls}>{rc.label}</span>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-muted">
                      {userAccesses.length}事業
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      {u.is_active
                        ? <span className="badge-green">アクティブ</span>
                        : <span className="badge-red">停止中</span>}
                    </td>
                    <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={u.global_role}
                          onChange={e => handleRoleChange(u.id, e.target.value as GlobalRole)}
                          disabled={loading === u.id}
                          className="bg-bg3 border border-border rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-accent"
                        >
                          <option value="admin">Admin</option>
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={loading === u.id}
                          className={clsx('btn-ghost px-2 py-1 text-[11px]', u.is_active ? 'text-danger hover:text-danger' : 'text-success hover:text-success')}
                        >
                          {u.is_active ? '停止' : '有効化'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${u.id}-detail`} className="bg-bg2/60 border-b border-border">
                      <td colSpan={5} className="px-4 py-3">
                        <div className="text-xs text-muted mb-2 font-semibold">アクセス可能な事業</div>
                        <div className="flex flex-wrap gap-2">
                          {businesses.map(biz => {
                            const hasAccess = userAccesses.some(a => a.business_id === biz.id)
                            return (
                              <div key={biz.id} className="flex items-center gap-1.5">
                                <span className={clsx(
                                  'w-2 h-2 rounded-full',
                                  hasAccess ? 'bg-success' : 'bg-bg3'
                                )} />
                                <span className={clsx('text-xs', hasAccess ? 'text-white' : 'text-muted')}>
                                  {biz.name.split('（')[0]}
                                </span>
                              </div>
                            )
                          })}
                          {businesses.length === 0 && (
                            <span className="text-xs text-muted">事業が登録されていません</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
