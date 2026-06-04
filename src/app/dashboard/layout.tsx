'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardProvider, { useDashboard } from '@/contexts/dashboard'

function Sidebar() {
  const pathname = usePathname()
  const { bookcaseUrl } = useDashboard()
  const router = useRouter()

  const nav = [
    { label: '概览',     href: '/dashboard',           icon: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6zM4 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z' },
    { label: '上传样册', href: '/dashboard/upload',    icon: 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: '样册列表', href: '/dashboard/books',     icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { label: '分类管理', href: '/dashboard/categories', icon: 'M7 7h-1a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-1' },
  ]

  const active = (h: string) => pathname === h
    ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500'
    : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'

  return (
    <aside className="w-56 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-5 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white font-bold text-sm">E</div>
          <span className="text-white font-semibold text-sm">电子样册</span>
        </Link>
      </div>
      <nav className="flex-1 py-3 space-y-0.5">
        {nav.map(n => (
          <Link key={n.href} href={n.href}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition ${active(n.href)}`}>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={n.icon} />
            </svg>
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-800 space-y-2">
        <Link href={bookcaseUrl} target="_blank"
          className="flex items-center justify-center gap-1.5 w-full px-3 py-2 text-xs text-blue-400 hover:bg-blue-900/20 rounded-lg transition">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          查看书橱
        </Link>
        <button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/') }}
          className="w-full px-3 py-2 text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition">
          退出登录
        </button>
      </div>
    </aside>
  )
}

function InnerLayout({ children }: { children: React.ReactNode }) {
  const { user, bookcaseUrl } = useDashboard()

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-12 bg-gray-900/80 border-b border-gray-800 flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <span className="font-medium">管理后台</span>
            <span className="text-gray-600">·</span>
            <span className="text-gray-500">{user?.username}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>{bookcaseUrl}</span>
            <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}${bookcaseUrl}`)}
              className="px-2 py-0.5 text-gray-500 hover:text-gray-300 bg-gray-800 hover:bg-gray-700 rounded transition">
              复制
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <InnerLayout>{children}</InnerLayout>
    </DashboardProvider>
  )
}
