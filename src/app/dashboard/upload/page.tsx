'use client'

import { useState, useRef } from 'react'
import { useDashboard } from '@/contexts/dashboard'

export default function UploadPage() {
  const { categories, refresh, loading } = useDashboard()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file || !title) return

    setUploading(true); setMessage('')
    const fd = new FormData()
    fd.append('file', file); fd.append('title', title); fd.append('category', category)

    const res = await fetch('/api/books', { method: 'POST', body: fd })
    if (res.ok) {
      setTitle(''); setCategory('')
      if (fileRef.current) fileRef.current.value = ''
      setMessage('上传成功！')
      refresh()
    } else {
      const d = await res.json()
      setMessage(`上传失败：${d.error}`)
    }
    setUploading(false)
  }

  if (loading) return <PageLoader />

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h2 className="text-lg font-bold text-white mb-6">上传样册</h2>

      <form onSubmit={handleUpload} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">样册标题 <span className="text-red-400">*</span></label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="例如：综合样本、产品手册"
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600
                      focus:outline-none focus:border-blue-500 transition" required />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">分类（可选）</label>
          <input type="text" value={category} onChange={e => setCategory(e.target.value)}
            placeholder="输入已有分类名或新建"
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600
                      focus:outline-none focus:border-blue-500 transition"
            list="category-datalist" />
          <datalist id="category-datalist">
            {categories.map(c => <option key={c.id} value={c.name} />)}
          </datalist>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">PDF 文件 <span className="text-red-400">*</span></label>
          <input ref={fileRef} type="file" accept=".pdf"
            className="w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg
                      file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition cursor-pointer" required />
          <p className="text-xs text-gray-600 mt-1">支持 PDF 格式，最大 200MB</p>
        </div>

        <div className="flex items-center gap-4 pt-1">
          <button type="submit" disabled={uploading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition">
            {uploading ? '上传中...' : '上传样册'}
          </button>
          {message && (
            <span className={`text-sm ${message.includes('失败') ? 'text-red-400' : 'text-green-400'}`}>{message}</span>
          )}
        </div>
      </form>
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
