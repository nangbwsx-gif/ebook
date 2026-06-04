'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface PDFViewerProps {
  pdfUrl: string
}

/** A4 纸标准高度（pt），超过此高度的物理页将被切分为多个虚拟页 */
const A4_HEIGHT = 842

interface VirtualPage {
  physical: number     // 物理页号（1-based）
  offsetY: number      // 在该物理页中的 Y 偏移（pt）
  height: number       // 本虚拟页的高度（pt）
}

export default function PDFViewer({ pdfUrl }: PDFViewerProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.5)
  const [loading, setLoading] = useState(true)
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [showJump, setShowJump] = useState(false)
  const [jumpInput, setJumpInput] = useState('')
  const [turning, setTurning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [splitInfo, setSplitInfo] = useState('')

  const mainCanvasRef = useRef<HTMLCanvasElement>(null)
  const nextCanvasRef = useRef<HTMLCanvasElement>(null)
  const clipWrapRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const jumpInputRef = useRef<HTMLInputElement>(null)
  const prevLoadingRef = useRef(true)
  const turningRef = useRef(false)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const turnDirRef = useRef<'next' | 'prev'>('next')
  const skipNextRenderRef = useRef(false)
  const touchSwipedRef = useRef(false)

  // 虚拟页映射表（永远不为空，物理页数 = totalPages 时表示无需切分）
  const vpagesRef = useRef<VirtualPage[]>([])
  // 缓存 key: "phys@offset" → ImageData
  const pageCacheRef = useRef<Map<string, ImageData>>(new Map())
  const preloadingRef = useRef<Set<string>>(new Set())

  const goNextRef = useRef<() => void>(() => {})
  const goPrevRef = useRef<() => void>(() => {})

  // ─── 加载 PDF + 构建虚拟页映射 ───
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setCurrentPage(1)
    setError(null)
    setPdfDoc(null)
    setSplitInfo('')
    pageCacheRef.current.clear()
    preloadingRef.current.clear()
    vpagesRef.current = []

    async function loadPDF() {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
        const doc = await pdfjsLib.getDocument(pdfUrl).promise
        if (cancelled) return

        // 构建虚拟页映射
        const vp: VirtualPage[] = []
        for (let p = 1; p <= doc.numPages; p++) {
          const page = await doc.getPage(p)
          const physHeight = page.getViewport({ scale: 1 }).height

          if (physHeight <= A4_HEIGHT) {
            vp.push({ physical: p, offsetY: 0, height: physHeight })
          } else {
            const segments = Math.ceil(physHeight / A4_HEIGHT)
            for (let s = 0; s < segments; s++) {
              const segH = Math.min(A4_HEIGHT, physHeight - s * A4_HEIGHT)
              vp.push({ physical: p, offsetY: s * A4_HEIGHT, height: segH })
            }
          }
        }
        vpagesRef.current = vp

        const physCount = doc.numPages
        setTotalPages(vp.length)
        if (vp.length !== physCount) {
          setSplitInfo(`${physCount} 页 PDF → A4 切分为 ${vp.length} 屏`)
        }

        setPdfDoc(doc)

        // 回写物理页数
        const bookId = pdfUrl.split('/').pop()?.replace('.pdf', '')
        if (bookId && physCount > 0) {
          fetch(`/api/books/${bookId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pages: physCount }),
          }).catch(() => {})
        }
      } catch {
        if (!cancelled) {
          setLoading(false)
          setError('样册加载失败，请检查文件是否完整或网络连接')
        }
      }
    }
    loadPDF()
    return () => { cancelled = true }
  }, [pdfUrl])

  // ─── 渲染一个虚拟页到 Canvas ───
  const cacheKey = (vp: VirtualPage) => `${vp.physical}@${vp.offsetY}`

  const renderToCanvas = useCallback(async (
    vpageIndex: number,
    canvas: HTMLCanvasElement
  ): Promise<boolean> => {
    const vp = vpagesRef.current[vpageIndex - 1]
    if (!pdfDoc || !vp) return false

    const key = cacheKey(vp)
    try {
      const ctx = canvas.getContext('2d')!

      // 命中缓存 → 直接 put
      const cached = pageCacheRef.current.get(key)
      if (cached) {
        canvas.width = cached.width
        canvas.height = cached.height
        ctx.putImageData(cached, 0, 0)
        return true
      }

      const page = await pdfDoc.getPage(vp.physical)
      const physHeight = page.getViewport({ scale: 1 }).height

      // 无需切分 → 正常渲染整页
      if (physHeight <= A4_HEIGHT && vp.offsetY === 0) {
        const viewport = page.getViewport({ scale })
        canvas.width = Math.ceil(viewport.width)
        canvas.height = Math.ceil(viewport.height)
        await page.render({ canvasContext: ctx, viewport }).promise
      } else {
        // 需要切分 → 只渲染 offset 处的片段
        const viewport = page.getViewport({
          scale,
          offsetX: 0,
          offsetY: -vp.offsetY,
        })
        // 画布高度 = 片段高度 × 缩放
        const segPixelH = Math.ceil(vp.height * scale)
        canvas.width = Math.ceil(viewport.width)
        canvas.height = segPixelH
        await page.render({ canvasContext: ctx, viewport }).promise
      }

      // 存缓存
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      pageCacheRef.current.set(key, imageData)
      return true
    } catch {
      return false
    }
  }, [pdfDoc, scale])

  // ─── 预加载邻居 ───
  const preloadNeighbors = useCallback(async (vIdx: number) => {
    if (!pdfDoc || vpagesRef.current.length < 2) return
    const neighbors = [vIdx + 1, vIdx - 1].filter(
      p => {
        const vp = vpagesRef.current[p - 1]
        if (!vp) return false
        const k = cacheKey(vp)
        return !pageCacheRef.current.has(k) && !preloadingRef.current.has(k)
      }
    )
    for (const p of neighbors) {
      const k = cacheKey(vpagesRef.current[p - 1])
      preloadingRef.current.add(k)
      try {
        const offscreen = document.createElement('canvas')
        await renderToCanvas(p, offscreen)
      } catch { /* ok */ }
      preloadingRef.current.delete(k)
    }
  }, [pdfDoc, renderToCanvas])

  // ─── 渲染当前虚拟页到主画布 ───
  useEffect(() => {
    if (!pdfDoc || !mainCanvasRef.current) return

    if (skipNextRenderRef.current) {
      skipNextRenderRef.current = false
      return
    }

    let cancelled = false
    setLoading(true)
    setShowJump(false)

    renderToCanvas(currentPage, mainCanvasRef.current).then((ok) => {
      if (!cancelled) {
        if (ok) {
          setLoading(false)
          preloadNeighbors(currentPage)
        } else {
          setError('页面渲染失败，请缩小显示比例后重试')
        }
      }
    }).catch(() => {
      if (!cancelled) setError('页面渲染出错，请尝试缩小显示比例')
    })
    return () => { cancelled = true }
  }, [pdfDoc, currentPage, renderToCanvas, preloadNeighbors])

  // ─── 入场动画 ───
  useEffect(() => {
    if (prevLoadingRef.current && !loading && scrollRef.current) {
      const el = scrollRef.current
      el.style.transition = 'none'
      el.style.opacity = '0.95'
      el.style.transform = 'translateY(5px)'
      void el.offsetHeight
      el.style.transition = 'opacity 0.18s ease-out, transform 0.22s ease-out'
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
      setTimeout(() => { el.style.transition = ''; el.style.transform = ''; el.style.opacity = '' }, 300)
    }
    prevLoadingRef.current = loading
  }, [loading])

  // ─── 翻页动画 ───
  const turnPage = useCallback(async (direction: 'next' | 'prev') => {
    if (turningRef.current || !pdfDoc || !clipWrapRef.current || !mainCanvasRef.current || !nextCanvasRef.current) return
    const target = direction === 'next' ? currentPage + 1 : currentPage - 1
    if (target < 1 || target > totalPages) return

    turningRef.current = true
    setTurning(true)
    turnDirRef.current = direction

    await renderToCanvas(target, nextCanvasRef.current)
    if (!turningRef.current) {
      const m = mainCanvasRef.current!, n = nextCanvasRef.current!
      const c = m.getContext('2d')!
      c.clearRect(0, 0, m.width, m.height)
      m.width = n.width; m.height = n.height
      c.drawImage(n, 0, 0)
      skipNextRenderRef.current = true
      setTurning(false)
      setCurrentPage(target)
      return
    }

    const wrap = clipWrapRef.current
    const isNext = direction === 'next'
    const sc = 'inset(0 0% 0 0)'
    const ec = isNext ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)'
    wrap.style.transition = 'none'; wrap.style.clipPath = sc
    void wrap.offsetHeight
    wrap.style.transition = 'clip-path 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
    wrap.style.clipPath = ec

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        if (!turningRef.current) { resolve(); return }
        const m = mainCanvasRef.current!, n = nextCanvasRef.current!
        const c = m.getContext('2d')!
        c.clearRect(0, 0, m.width, m.height)
        m.width = n.width; m.height = n.height
        c.drawImage(n, 0, 0)
        wrap.style.transition = 'none'; wrap.style.clipPath = sc
        skipNextRenderRef.current = true
        setTurning(false)
        setCurrentPage(target)
        turningRef.current = false
        resolve()
      }, 380)
    })
  }, [pdfDoc, currentPage, totalPages, renderToCanvas])

  goNextRef.current = useCallback(() => turnPage('next'), [turnPage])
  goPrevRef.current = useCallback(() => turnPage('prev'), [turnPage])
  const goNext = useCallback(() => goNextRef.current(), [])
  const goPrev = useCallback(() => goPrevRef.current(), [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNextRef.current()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrevRef.current()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const zoomIn  = () => setScale(s => Math.min(3,  s + 0.25))
  const zoomOut = () => setScale(s => Math.max(0.5, s - 0.25))
  const resetView = () => { setCurrentPage(1); setScale(1.5) }

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (touchSwipedRef.current) { touchSwipedRef.current = false; return }
    if (turning) return
    const r = scrollRef.current?.getBoundingClientRect()
    if (!r) return
    const x = e.clientX - r.left
    if (x < r.width * 0.35) goPrev()
    else if (x > r.width * 0.65) goNext()
  }

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    touchSwipedRef.current = false
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (Math.abs(e.touches[0].clientX - touchStartX.current) > 10 ||
        Math.abs(e.touches[0].clientY - touchStartY.current) > 10) touchSwipedRef.current = true
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchSwipedRef.current) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      dx > 0 ? goPrev() : goNext()
    }
  }

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault()
    const p = parseInt(jumpInput)
    if (p >= 1 && p <= totalPages) { setCurrentPage(p); setShowJump(false); setJumpInput('') }
  }

  // ─── 错误 ───
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-sm px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-gray-300 font-medium mb-2">加载失败</p>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition">
            重新加载
          </button>
        </div>
      </div>
    )
  }

  // ─── 加载中 ───
  if (!pdfDoc) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="flex gap-3 justify-center mb-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-gray-500 text-sm">加载样册中...</p>
        </div>
      </div>
    )
  }

  const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0

  return (
    <div className="flex flex-col h-full select-none">
      {/* 工具栏 */}
      <header className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-800/50 px-3 py-1.5
                      flex items-center justify-between shrink-0 gap-1 z-30">
        <div className="flex items-center gap-0.5">
          <button onClick={goPrev} disabled={currentPage <= 1 || turning}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg disabled:opacity-20 transition-all active:scale-90">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="relative mx-0.5">
            <button onClick={() => { setShowJump(true); setTimeout(() => jumpInputRef.current?.focus(), 50) }}
              className="px-2.5 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg font-medium tabular-nums min-w-[80px] text-center">
              <span className="text-white">{currentPage}</span>
              <span className="text-gray-600 mx-0.5">/</span>
              <span className="text-gray-500">{totalPages}</span>
            </button>
            {showJump && (
              <form onSubmit={handleJump}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-gray-800 border border-gray-700 rounded-xl p-2 shadow-2xl z-50 flex items-center gap-1.5"
                onKeyDown={e => { if (e.key === 'Escape') { setShowJump(false); setJumpInput('') } }}>
                <input ref={jumpInputRef} type="number" min={1} max={totalPages}
                  value={jumpInput} onChange={e => setJumpInput(e.target.value)}
                  className="w-18 px-2 py-1.5 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm text-center
                            focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  placeholder="页数" autoFocus />
                <button type="submit" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg active:scale-90 font-medium">
                  跳转
                </button>
              </form>
            )}
          </div>

          <button onClick={goNext} disabled={currentPage >= totalPages || turning}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg disabled:opacity-20 transition-all active:scale-90">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="hidden sm:flex items-center flex-1 max-w-xs mx-3">
          <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <button onClick={zoomOut} disabled={scale <= 0.5 || turning}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all active:scale-90 disabled:opacity-20" title="缩小">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
            </svg>
          </button>
          <span className="text-xs text-gray-400 w-12 text-center tabular-nums font-medium">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} disabled={scale >= 3 || turning}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all active:scale-90 disabled:opacity-20" title="放大">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <div className="w-px h-5 bg-gray-700/50 mx-0.5" />
          <button onClick={resetView} disabled={turning}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all active:scale-90 disabled:opacity-20" title="重置">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </header>

      {/* 分页提示 */}
      {splitInfo && (
        <div className="bg-blue-900/30 border-b border-blue-800/30 px-3 py-1 text-center">
          <span className="text-xs text-blue-300">{splitInfo}</span>
        </div>
      )}

      {/* 画布区 */}
      <div ref={scrollRef}
        className="flex-1 overflow-auto flex justify-center bg-[#1a1a2e]"
        onClick={handleCanvasClick}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      >
        <div className="relative my-4 inline-flex">
          {loading && !turning && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a2e]/80 z-20 rounded-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-gray-500">加载中...</span>
              </div>
            </div>
          )}

          <div className="relative" style={{ display: 'grid' }}>
            <div className="row-start-1 col-start-1" style={{ gridArea: '1/1' }}>
              <canvas ref={nextCanvasRef} className="shadow-2xl rounded-sm"
                style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
            </div>
            <div ref={clipWrapRef} className="row-start-1 col-start-1" style={{ gridArea: '1/1', clipPath: 'inset(0 0% 0 0)' }}>
              <canvas ref={mainCanvasRef} className="shadow-2xl rounded-sm"
                style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
              <div className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none"
                style={{ background: 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.03) 50%, rgba(0,0,0,0.06) 100%)', clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}>
                <div className="absolute bottom-0 right-0 w-12 h-12"
                  style={{ background: 'linear-gradient(315deg, transparent 40%, rgba(255,255,255,0.02) 100%)', clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }} />
              </div>
              <div className="absolute top-0 bottom-0 w-10 pointer-events-none z-10"
                style={{ right: 0, background: 'linear-gradient(to left, rgba(0,0,0,0.08), transparent)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="shrink-0 flex justify-center pb-2 pt-1 bg-[#1a1a2e]">
        <div className="flex items-center gap-3 text-[11px] text-gray-600">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-400 font-mono text-[10px]">←</kbd>
            <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-400 font-mono text-[10px]">→</kbd>
            键盘翻页
          </span>
          <span className="w-px h-3 bg-gray-800" />
          <span>点击左右翻页</span>
          <span className="w-px h-3 bg-gray-800" />
          <span>滑动翻页</span>
        </div>
      </div>
    </div>
  )
}
