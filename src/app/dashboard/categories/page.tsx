'use client'

import { useState } from 'react'
import { useDashboard } from '@/contexts/dashboard'

export default function CategoriesPage() {
  const { categories, refresh, loading } = useDashboard()
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  if (loading) return <PageLoader />

  async function create() {
    if (!newName.trim()) return
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    if (res.ok) { setNewName(''); refresh() }
  }

  async function rename(id: string) {
    if (!editName.trim()) return
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim() }),
    })
    if (res.ok) { setEditingId(null); setEditName(''); refresh() }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`确定删除「${name}」？分类下的样册将变为未分类。`)) return
    await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    refresh()
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">分类管理</h2>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">管理样册分类，方便在书橱中分组展示</p>

      <div className="flex items-center gap-3 mb-6">
        <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') create() }}
          placeholder="新分类名称"
          className="flex-1 px-3 py-2.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-400
                    dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder-gray-600
                    rounded-lg text-sm focus:outline-none focus:border-blue-500 transition" />
        <button onClick={create}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition shrink-0">
          + 创建
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800 rounded-xl py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
          暂无分类，上传样册时输入分类名即可自动创建
        </div>
      ) : (
        <div className="bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {categories.map(cat => (
              <div key={cat.id} className="px-5 py-3 flex items-center justify-between">
                {editingId === cat.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                      className="px-2.5 py-1.5 bg-gray-50 border border-gray-300 text-gray-900
                                dark:bg-gray-800 dark:border-gray-600 dark:text-white
                                rounded text-sm flex-1 focus:outline-none focus:border-blue-500"
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') rename(cat.id); if (e.key === 'Escape') setEditingId(null) }} />
                    <button onClick={() => rename(cat.id)}
                      className="px-3 py-1.5 text-xs text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition">保存</button>
                    <button onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded transition">取消</button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-900 dark:text-white text-sm">{cat.name}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-600">{cat._count.books} 本</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditingId(cat.id); setEditName(cat.name) }}
                        className="px-2.5 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded transition">重命名</button>
                      <button onClick={() => remove(cat.id, cat.name)}
                        className="px-2.5 py-1 text-xs text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded transition">删除</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
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
