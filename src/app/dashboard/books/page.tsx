'use client'

import { useState } from 'react'
import { useDashboard } from '@/contexts/dashboard'
import Link from 'next/link'

export default function BooksPage() {
  const { books, categories, refresh, loading } = useDashboard()
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameTitle, setRenameTitle] = useState('')

  if (loading) return <PageLoader />

  async function handleDelete(id: string, title: string) {
    if (!confirm(`确定要删除《${title}》吗？`)) return
    await fetch(`/api/books/${id}`, { method: 'DELETE' })
    refresh()
  }

  async function handleRename(id: string) {
    if (!renameTitle.trim()) return
    const res = await fetch(`/api/books/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: renameTitle.trim() }),
      credentials: 'include',
    })
    if (res.ok) { setRenamingId(null); setRenameTitle(''); refresh() }
  }

  async function changeCategory(bookId: string, categoryId: string) {
    await fetch(`/api/books/${bookId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId: categoryId || null }),
      credentials: 'include',
    })
    refresh()
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">样册列表</h2>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">共 {books.length} 本</p>

      {books.length === 0 ? (
        <div className="bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800 rounded-xl py-16 text-center">
          <svg className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">暂无样册</p>
          <Link href="/dashboard/upload" className="text-sm text-blue-600 dark:text-blue-400 hover:underline transition">上传第一本样册 →</Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {books.map(book => (
              <div key={book.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition">
                <div className="flex items-center gap-4 min-w-0">
                  {/* 封面缩略 */}
                  <div className="w-10 h-14 rounded flex items-center justify-center shrink-0 overflow-hidden
                                bg-gray-100 dark:bg-gray-800">
                    {book.coverUrl ? (
                      <img src={book.coverUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <svg className="w-5 h-5 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    {renamingId === book.id ? (
                      <div className="flex items-center gap-2">
                        <input type="text" value={renameTitle} onChange={e => setRenameTitle(e.target.value)}
                          className="px-2 py-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm
                                    dark:bg-gray-800 dark:border-gray-600 dark:text-white
                                    rounded focus:outline-none focus:border-blue-500 w-48"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleRename(book.id)
                            if (e.key === 'Escape') { setRenamingId(null); setRenameTitle('') }
                          }} />
                        <button onClick={() => handleRename(book.id)}
                          className="px-2 py-1 text-xs text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition">保存</button>
                        <button onClick={() => { setRenamingId(null); setRenameTitle('') }}
                          className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded transition">取消</button>
                      </div>
                    ) : (
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{book.title}</h3>
                    )}
                    {/* 页码 + 提示 */}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
                      <PagesLabel pages={book.pages} />
                      <span className="mx-1 text-gray-300 dark:text-gray-700">·</span>
                      {new Date(book.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                    <select
                      value={book.category?.id || ''}
                      onChange={e => changeCategory(book.id, e.target.value)}
                      className="mt-1 text-xs bg-gray-100 border border-gray-200 text-gray-600
                                dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300
                                rounded px-1.5 py-0.5 focus:outline-none focus:border-blue-500 cursor-pointer">
                      <option value="">未分类</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <a href={book.pdfUrl} download={`${book.title}.pdf`}
                    className="px-3 py-1.5 text-xs text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30 rounded-lg transition flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    下载
                  </a>
                  <Link href={`/book/${book.id}`} target="_blank"
                    className="px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition">预览</Link>
                  <button onClick={() => { setRenamingId(book.id); setRenameTitle(book.title) }}
                    className="px-3 py-1.5 text-xs text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/30 rounded-lg transition">重命名</button>
                  <button onClick={() => handleDelete(book.id, book.title)}
                    className="px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition">删除</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** 页码标签：0页显示"页数待解析"，1页带提示 */
function PagesLabel({ pages }: { pages: number }) {
  if (pages <= 0) {
    return (
      <span className="text-amber-500 dark:text-amber-400" title="PDF 首次打开后将自动解析页数">
        页数待解析
      </span>
    )
  }
  if (pages === 1) {
    return (
      <span title="此 PDF 仅含 1 页（可能为超长页，阅读器已自动适配滚动模式）">
        1 页 <span className="text-gray-400 dark:text-gray-600 cursor-help">ⓘ</span>
      </span>
    )
  }
  return <span>{pages} 页</span>
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
