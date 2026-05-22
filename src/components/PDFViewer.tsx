'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface PDFViewerProps {
  pdfUrl: string
}

export default function PDFViewer({ pdfUrl }: PDFViewerProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.5)
  const [loading, setLoading] = useState(true)
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 加载PDF
  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function loadPDF() {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`

        const doc = await pdfjsLib.getDocument(pdfUrl).promise
        if (!cancelled) {
          setPdfDoc(doc)
          setTotalPages(doc.numPages)
          // 更新书籍页数到数据库
          fetch(`/api/books/${pdfUrl.split('/').pop()?.replace('.pdf', '')}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pages: doc.numPages }),
          }).catch(() => {})
        }
      } catch (err) {
        console.error('Failed to load PDF:', err)
        if (!cancelled) setLoading(false)
      }
    }
    loadPDF()
    return () => { cancelled = true }
  }, [pdfUrl])

  // 渲染页面
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return
    setLoading(true)
    try {
      const page = await pdfDoc.getPage(pageNum)
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')!
      const viewport = page.getViewport({ scale })
      canvas.width = viewport.width
      canvas.height = viewport.height
      await page.render({ canvasContext: ctx, viewport }).promise
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }, [pdfDoc, scale])

  useEffect(() => {
    if (pdfDoc) renderPage(currentPage)
  }, [pdfDoc, currentPage, scale, renderPage])

  const goNext = () => { if (currentPage < totalPages) setCurrentPage(p => p + 1) }
  const goPrev = () => { if (currentPage > 1) setCurrentPage(p => p - 1) }
  const zoomIn = () => setScale(s => Math.min(s + 0.25, 3))
  const zoomOut = () => setScale(s => Math.max(s - 0.25, 0.5))

  // 键盘翻页
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [currentPage, totalPages])

  if (!pdfDoc) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="flex gap-2 justify-center mb-4">
            <span className="loading-dot w-3 h-3 bg-blue-500 rounded-full inline-block" />
            <span className="loading-dot w-3 h-3 bg-blue-500 rounded-full inline-block" />
            <span className="loading-dot w-3 h-3 bg-blue-500 rounded-full inline-block" />
          </div>
          <p className="text-gray-500">加载样册中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 工具栏 */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1">
          <button onClick={goPrev} disabled={currentPage <= 1}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded disabled:opacity-30 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm text-gray-300 min-w-[80px] text-center">
            {currentPage} / {totalPages}
          </span>
          <button onClick={goNext} disabled={currentPage >= totalPages}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded disabled:opacity-30 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={zoomOut}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          <span className="text-sm text-gray-500 w-14 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </button>
          <button onClick={() => { setCurrentPage(1); setScale(1.5) }}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>

      {/* PDF 画布 */}
      <div ref={containerRef}
        className="flex-1 overflow-auto flex justify-center p-4 bg-gray-950"
        onClick={(e) => {
          const rect = containerRef.current?.getBoundingClientRect()
          if (!rect) return
          const x = e.clientX - rect.left
          const w = rect.width
          if (x < w / 3) goPrev()
          else if (x > (w * 2) / 3) goNext()
        }}>
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-950/50 z-10">
              <div className="flex gap-2">
                <span className="loading-dot w-3 h-3 bg-blue-500 rounded-full inline-block" />
                <span className="loading-dot w-3 h-3 bg-blue-500 rounded-full inline-block" />
                <span className="loading-dot w-3 h-3 bg-blue-500 rounded-full inline-block" />
              </div>
            </div>
          )}
          <canvas ref={canvasRef} className="shadow-2xl" />
        </div>
      </div>
    </div>
  )
}
