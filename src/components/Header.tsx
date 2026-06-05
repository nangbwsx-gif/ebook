'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Header({ showSlug }: { showSlug?: string }) {
  const [showContact, setShowContact] = useState(false)
  const [user, setUser] = useState<{ username: string; slug: string } | null>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (showSlug) return
    fetch('/api/auth/check')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setUser(data))
      .catch(() => setUser(null))
  }, [showSlug])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`sticky top-0 z-50 transition-all duration-500 ${
      scrolled
        ? 'bg-gray-950/80 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/20'
        : 'bg-gray-950/40 backdrop-blur-sm border-b border-white/[0.03]'
    }`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group hover:opacity-90 transition-opacity">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
              E
            </div>
            <div className="absolute -inset-0.5 bg-blue-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">电子样册</h1>
            <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
              {showSlug ? `@${showSlug}` : '产品样本在线浏览'}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowContact(!showContact)}
            className={`px-4 py-2 text-sm rounded-xl transition-all duration-300 ${
              showContact
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            关于我们
          </button>
          {user && !showSlug && (
            <Link href="/dashboard"
              className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5">
              进入管理
            </Link>
          )}
        </div>
      </div>

      {showContact && (
        <div className="border-t border-white/5 bg-gray-950/95 backdrop-blur-xl animate-fade-in-up">
          <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            <div className="space-y-2">
              <h3 className="text-white font-semibold text-base mb-3">联系方式</h3>
              <p className="text-gray-400">电话：请致电咨询</p>
              <p className="text-gray-400">邮箱：info@example.com</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-white font-semibold text-base mb-3">地址</h3>
              <p className="text-gray-400">公司地址信息</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-white font-semibold text-base mb-3">二维码</h3>
              <div className="w-28 h-28 bg-white/5 rounded-xl flex items-center justify-center text-xs text-gray-600 border border-white/5">
                二维码占位
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
