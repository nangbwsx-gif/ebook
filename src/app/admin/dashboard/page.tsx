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
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    loadData()
  }, [])

  async function checkAuth() {
    const res = await fetch('/api/auth/check')
    if (!res.ok) router.push('/admin/login')
  }

  async function loadData() {
    const [booksRes, catsRes] = await Promise.all([
      fetch('/api/books'),
      fetch('/api/categories'),
    ])
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

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-white font-bold">管理后台</h1>
        </div>
        <button
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' })
            router.push('/admin/login')
          }}
          className="text-sm text-gray-400 hover:text-white transition"
        >
          退出登录
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* 上传区域 */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">上传新样册</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">样册标题 *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="例如：综合样本"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">分类（可选）</label>
                <input
                  type="text"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="例如：供水设备"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
                  list="category-list"
                />
                <datalist id="category-list">
                  {categories.map(c => <option key={c.id} value={c.name} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">PDF文件 *</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition"
                  required
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={uploading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition"
              >
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

        {/* 书籍列表 */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-lg font-bold text-white">
              样册列表 <span className="text-sm text-gray-500 font-normal">({books.length}本)</span>
            </h2>
          </div>
          {books.length === 0 ? (
            <div className="text-center py-12 text-gray-500">暂无样册，请上传</div>
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
                        {book.pages}页 · {book.category?.name || '未分类'} · {new Date(book.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <Link href={`/book/${book.id}`} target="_blank"
                      className="px-3 py-1 text-xs text-blue-400 hover:bg-blue-900/30 rounded transition">
                      预览
                    </Link>
                    <button
                      onClick={() => handleDelete(book.id, book.title)}
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
