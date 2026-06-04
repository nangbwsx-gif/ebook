'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Header({ showSlug }: { showSlug?: string }) {
  const [showContact, setShowContact] = useState(false)
  const [user, setUser] = useState<{ username: string; slug: string } | null>(null)

  useEffect(() => {
    fetch('/api/auth/check')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setUser(data))
      .catch(() => setUser(null))
  }, [])

  return (
    <header className="bg-gray-950 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            E
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">电子样册</h1>
            <p className="text-xs text-gray-400">{showSlug ? `@${showSlug}` : '产品样本在线浏览'}</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowContact(!showContact)}
            className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition"
          >
            关于我们
          </button>
          {user && !showSlug && (
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              进入管理
            </Link>
          )}
        </div>
      </div>

      {showContact && (
        <div className="border-t border-gray-800 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-400">
            <div>
              <h3 className="text-white font-medium mb-2">联系方式</h3>
              <p>电话：请致电咨询</p>
              <p>邮箱：info@example.com</p>
            </div>
            <div>
              <h3 className="text-white font-medium mb-2">地址</h3>
              <p>公司地址信息</p>
            </div>
            <div>
              <h3 className="text-white font-medium mb-2">二维码</h3>
              <div className="w-24 h-24 bg-gray-800 rounded flex items-center justify-center text-xs">
                二维码占位
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
