'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Book {
  id: string
  title: string
  description: string | null
  coverUrl: string | null
  pdfUrl: string
  pages: number
  createdAt: string
  category: { id: string; name: string } | null
}

interface Category {
  id: string
  name: string
  _count: { books: number }
}

export default function DashboardPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [user, setUser] = useState<{ username: string; slug: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [userRes, booksRes, catsRes] = await Promise.all([
      fetch('/api/auth/check'),
      fetch('/api/books'),
      fetch('/api/categories'),
    ])
    if (!userRes.ok) {
      router.push('/admin/login')
      return
    }
    setUser(await userRes.json())
    if (booksRes.ok) setBooks(await booksRes.json())
    if (catsRes.ok) setCategories(await catsRes.json())
    setLoading(false)
  }

  async function handleUpload(e: FormEvent) {
    e.preventDefault()
    if (!file || !title) return

    setUploading(true)
    setMessage('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title)
    formData.append('category', category)

    const res = await fetch('/api/books', { method: 'POST', body: formData })
    if (res.ok) {
      setTitle('')
      setCategory('')
      setFile(null)
      setMessage('上传成功！')
      loadData()
    } else {
      const data = await res.json()
      setMessage(`上传失败：${data.error}`)
    }
    setUploading(false)
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`确定要删除《${title}》吗？`)) return
    await fetch(`/api/books/${id}`, { method: 'DELETE' })
    loadData()
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  // ─── 分类管理 ───
  const [editingCat, setEditingCat] = useState<string | null>(null)
  const [editCatName, setEditCatName] = useState('')
  const [newCatName, setNewCatName] = useState('')

  async function handleCreateCategory() {
    if (!newCatName.trim()) return
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCatName.trim() }),
    })
    if (res.ok) {
      setNewCatName('')
      loadData()
    }
  }

  async function handleRenameCategory(id: string) {
    if (!editCatName.trim()) return
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editCatName.trim() }),
    })
    if (res.ok) {
      setEditingCat(null)
      setEditCatName('')
      loadData()
    }
  }

  async function handleDeleteCategory(id: string, name: string) {
    if (!confirm(`确定要删除分类「${name}」吗？该分类下的书籍将变为未分类`)) return
    await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    loadData()
  }

  async function handleChangeBookCategory(bookId: string, categoryId: string) {
    await fetch(`/api/books/${bookId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId: categoryId || null }),
    })
    loadData()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="flex gap-2">
          <span className="loading-dot w-3 h-3 bg-blue-500 rounded-full inline-block" />
          <span className="loading-dot w-3 h-3 bg-blue-500 rounded-full inline-block" />
          <span className="loading-dot w-3 h-3 bg-blue-500 rounded-full inline-block" />
        </div>
      </div>
    )
  }

  const bookcaseUrl = `/bookcase/${user?.slug}`

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={bookcaseUrl} prefetch={false} className="text-gray-400 hover:text-white transition" title="查看书橱">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-white font-bold">管理后台</h1>
          <span className="text-sm text-gray-500">({user?.username})</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href={bookcaseUrl} prefetch={false}
            className="text-sm text-blue-400 hover:text-blue-300 transition">
            查看书橱 →
          </Link>
          <button onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white transition">
            退出登录
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* 书橱链接信息 */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">你的书橱公开地址</p>
            <p className="text-blue-400 font-mono text-sm mt-0.5">
              {typeof window !== 'undefined' ? window.location.origin : ''}{bookcaseUrl}
            </p>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(`${window.location.origin}${bookcaseUrl}`)}
            className="px-3 py-1 text-xs bg-gray-800 text-gray-300 hover:text-white rounded transition">
            复制链接
          </button>
        </div>

        {/* 上传区域 */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">上传新样册</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">样册标题 *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="例如：综合样本"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
                  required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">分类（可选）</label>
                <input type="text" value={category} onChange={e => setCategory(e.target.value)}
                  placeholder="例如：供水设备"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
                  list="category-list" />
                <datalist id="category-list">
                  {categories.map(c => <option key={c.id} value={c.name} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">PDF文件 *</label>
                <input type="file" accept=".pdf"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition"
                  required />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={uploading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition">
                {uploading ? '上传中...' : '上传样册'}
              </button>
              {message && (
                <span className={`text-sm ${message.includes('失败') ? 'text-red-400' : 'text-green-400'}`}>
                  {message}
                </span>
              )}
            </div>
          </form>
        </div>

        {/* 分类管理 */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">分类管理</h2>
          </div>
          {/* 新建分类 */}
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateCategory() }}
              placeholder="新分类名称"
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition" />
            <button onClick={handleCreateCategory}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition">
              + 创建分类
            </button>
          </div>
          {categories.length === 0 ? (
            <p className="text-gray-500 text-sm">暂无分类，上传样册时创建分类即可</p>
          ) : (
            <div className="space-y-2">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between px-4 py-2 bg-gray-800/50 rounded-lg">
                  {editingCat === cat.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editCatName}
                        onChange={e => setEditCatName(e.target.value)}
                        className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') handleRenameCategory(cat.id); if (e.key === 'Escape') setEditingCat(null) }} />
                      <button onClick={() => handleRenameCategory(cat.id)}
                        className="px-2 py-1 text-xs text-green-400 hover:bg-green-900/30 rounded transition">保存</button>
                      <button onClick={() => setEditingCat(null)}
                        className="px-2 py-1 text-xs text-gray-400 hover:bg-gray-700 rounded transition">取消</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-white text-sm">{cat.name}</span>
                      <span className="text-xs text-gray-500">({cat._count.books}本)</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditingCat(cat.id); setEditCatName(cat.name) }}
                      className="px-2 py-1 text-xs text-blue-400 hover:bg-blue-900/30 rounded transition">
                      重命名
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      className="px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 rounded transition">
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 书籍列表 */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-lg font-bold text-white">
              样册列表 <span className="text-sm text-gray-500 font-normal">({books.length}本)</span>
            </h2>
          </div>
          {books.length === 0 ? (
            <div className="text-center py-12 text-gray-500">暂无样册，上传你的第一本样册吧</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {books.map(book => (
                <div key={book.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-850 transition">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-14 bg-gray-800 rounded flex items-center justify-center shrink-0 overflow-hidden">
                      {book.coverUrl ? (
                        <img src={book.coverUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-white truncate">{book.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {book.pages}页 · {new Date(book.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                      <div className="mt-1">
                        <select
                          value={book.category?.id || ''}
                          onChange={e => handleChangeBookCategory(book.id, e.target.value)}
                          className="text-xs bg-gray-800 border border-gray-700 rounded px-1 py-0.5 text-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer">
                          <option value="">未分类</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <Link href={`/book/${book.id}`} target="_blank"
                      className="px-3 py-1 text-xs text-blue-400 hover:bg-blue-900/30 rounded transition">
                      预览
                    </Link>
                    <button onClick={() => handleDelete(book.id, book.title)}
                      className="px-3 py-1 text-xs text-red-400 hover:bg-red-900/30 rounded transition">
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
