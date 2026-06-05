'use client'

import { useState, useEffect } from 'react'
import { useDashboard } from '@/contexts/dashboard'

export default function DashboardOverview() {
  const { books, categories, bookcaseUrl, loading } = useDashboard()
  const [origin, setOrigin] = useState('')

  useEffect(() => { setOrigin(window.location.origin) }, [])

  if (loading) return <PageLoader />

  const categorizedBooks = books.filter(b => b.category).length

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">概览</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="样册总数" value={books.length} color="blue" />
        <StatCard label="分类数量" value={categories.length} color="green" />
        <StatCard label="已分类样册" value={categorizedBooks} color="purple" />
      </div>

      <div className="bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800 rounded-xl p-5 mb-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">你的书橱公开地址</p>
        <div className="flex items-center gap-3">
          <code className="text-blue-600 dark:text-blue-400 text-sm font-mono bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg flex-1 truncate">
            {origin}{bookcaseUrl}
          </code>
          <button
            onClick={() => navigator.clipboard.writeText(`${origin}${bookcaseUrl}`)}
            className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shrink-0">
            复制链接
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">最近添加</h3>
        </div>
        {books.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 dark:text-gray-500 text-sm">还没有样册，去上传第一本吧</div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {books.slice(0, 5).map(book => (
              <div key={book.id} className="px-5 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white truncate">{book.title}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {book.pages}页 · {book.category?.name || '未分类'} · {new Date(book.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>
            ))}
            {books.length > 5 && (
              <div className="px-5 py-2 text-center text-xs text-gray-400 dark:text-gray-600">
                还有 {books.length - 5} 本样册
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue:  'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    purple:'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  }
  return (
    <div className="bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800 rounded-xl p-5">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${colors[color]}`}>{value}</p>
    </div>
  )
}

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex gap-2">
        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}
