import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '経営管理システム | PL Manager',
  description: '事業PL・予算・KPI管理ダッシュボード',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="dark">
      <body className="bg-bg text-white antialiased">{children}</body>
    </html>
  )
}
