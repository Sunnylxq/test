'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { useAppStore } from '@/store/appStore'
import type { Alert } from '@/types'

interface NavItem {
  href: string
  icon: string
  label: string
  badge?: number
}

interface SidebarProps {
  alertCount?: number
}

const NAV_MAIN: NavItem[] = [
  { href: '/dashboard',         icon: '🏠', label: 'ダッシュボード' },
  { href: '/analysis/alerts',   icon: '🔔', label: 'アラート' },
]

const NAV_ANALYSIS: NavItem[] = [
  { href: '/analysis/ranking',  icon: '🏆', label: 'ランキング' },
  { href: '/analysis/forecast', icon: '🔮', label: '年度予測' },
]

const NAV_DATA: NavItem[] = [
  { href: '/businesses',        icon: '🏢', label: '事業管理' },
]

const NAV_ADMIN: NavItem[] = [
  { href: '/admin/users',       icon: '👥', label: 'ユーザー管理' },
  { href: '/admin/settings',    icon: '⚙️', label: '設定' },
]

export default function Sidebar({ alertCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const { sidebarOpen } = useAppStore()

  function NavLink({ item }: { item: NavItem }) {
    const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
    return (
      <Link
        href={item.href}
        className={clsx(
          'flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium rounded-none border-l-[3px] transition-all',
          active
            ? 'border-accent bg-accent/10 text-accent'
            : 'border-transparent text-subtle hover:bg-bg3 hover:text-white'
        )}
      >
        <span className="text-base w-5 text-center">{item.icon}</span>
        <span>{item.label}</span>
        {item.href === '/analysis/alerts' && alertCount > 0 && (
          <span className="ml-auto bg-danger text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
            {alertCount}
          </span>
        )}
      </Link>
    )
  }

  function Section({ label, items }: { label: string; items: NavItem[] }) {
    return (
      <div className="mb-2">
        <div className="px-4 py-2 text-[10px] font-bold text-muted uppercase tracking-widest">{label}</div>
        {items.map(item => <NavLink key={item.href} item={item} />)}
      </div>
    )
  }

  if (!sidebarOpen) return null

  return (
    <nav className="w-[220px] min-w-[220px] bg-bg2 border-r border-border flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <span className="font-bold text-white text-base">
            PL <span className="text-accent">Manager</span>
          </span>
        </div>
      </div>

      <div className="flex-1 py-3">
        <Section label="メイン" items={NAV_MAIN} />
        <Section label="分析" items={NAV_ANALYSIS} />
        <Section label="データ" items={NAV_DATA} />
        <Section label="管理" items={NAV_ADMIN} />
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border">
        <form action="/api/auth/signout" method="post">
          <button type="submit" className="flex items-center gap-2 text-xs text-muted hover:text-white transition-colors w-full">
            <span>🚪</span> ログアウト
          </button>
        </form>
      </div>
    </nav>
  )
}
