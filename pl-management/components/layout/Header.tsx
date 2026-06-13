'use client'

import { useAppStore } from '@/store/appStore'
import { getFiscalYears } from '@/lib/utils/fiscal'
import type { Business, UserProfile } from '@/types'
import Link from 'next/link'

interface HeaderProps {
  user?: UserProfile | null
  businesses?: Business[]
}

export default function Header({ user, businesses = [] }: HeaderProps) {
  const { selectedBusinessId, setSelectedBusiness, fiscalYear, setFiscalYear, toggleSidebar } = useAppStore()
  const years = getFiscalYears(3)

  const selectedBiz = businesses.find(b => b.id === selectedBusinessId)

  return (
    <header className="h-14 bg-bg2 border-b border-border flex items-center px-4 gap-3 shrink-0">
      {/* Hamburger */}
      <button onClick={toggleSidebar} className="btn-ghost px-2">
        <span className="text-lg">☰</span>
      </button>

      <div className="flex-1" />

      {/* 事業切替 */}
      <div className="flex items-center gap-2">
        <select
          value={selectedBusinessId ?? ''}
          onChange={e => setSelectedBusiness(e.target.value || null)}
          className="bg-bg3 border border-border rounded-lg px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-accent cursor-pointer"
        >
          <option value="">全社表示</option>
          {businesses.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        {/* 年度 */}
        <select
          value={fiscalYear}
          onChange={e => setFiscalYear(Number(e.target.value))}
          className="bg-bg3 border border-border rounded-lg px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-accent cursor-pointer"
        >
          {years.map(y => (
            <option key={y} value={y}>{y}年度</option>
          ))}
        </select>
      </div>

      {/* アラート */}
      <Link href="/analysis/alerts" className="btn-ghost px-2 relative">
        <span className="text-lg">🔔</span>
      </Link>

      {/* ユーザー */}
      <div className="flex items-center gap-2 pl-2 border-l border-border">
        <div className="w-7 h-7 rounded-full bg-accent/30 flex items-center justify-center text-xs font-bold text-accent">
          {user?.full_name?.[0] ?? 'U'}
        </div>
        <span className="text-xs text-subtle hidden sm:block">{user?.full_name ?? 'ユーザー'}</span>
      </div>
    </header>
  )
}
