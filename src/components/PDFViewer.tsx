'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface PDFViewerProps {
  pdfUrl: string
}

/** 超过此高度（pt）的长页面将被切分为虚拟多页 */
const MAX_PAGE_HEIGHT = 1263 // A4 842pt * 1.5

/** 灰度页的暖色增强参数 */
const WARMTH = { r: 1.06, g: 1.03, b: 0.94 } // 微暖调

interface VirtualPage {
  physical: number    // 物理页号（1-based）
  offsetY: number     // 在该物理页中的 Y 偏移（pt）
  height: number      // 本虚拟页的高度（pt）
  index: number       // 虚拟页在该物理页中的序号
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
  const [pageInfo, setPageInfo] = useState('')

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

  // ─── 虚拟页映射表 & 页面缓存 ───
  const vpagesRef = useRef<VirtualPage[]>([])       // 虚拟→物理映射
  const pageCacheRef = useRef<Map<string, ImageData>>(new Map())  // key: "pNum@offsetY"
  const preloadingRef = useRef<Set<string>>(new Set())
  const goNextRef = useRef<() => void>(() => {})
  const goPrevRef = useRef<() => void>(() => {})

  // ─── 加载 PDF ───
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setCurrentPage(1)
    setError(null)
    setPdfDoc(null)
    setPageInfo('')
    pageCacheRef.current.clear()
    preloadingRef.current.clear()
    vpagesRef.current = []

    async function loadPDF() {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
        const doc = await pdfjsLib.getDocument(pdfUrl).promise
        if (cancelled) return

        setPdfDoc(doc)

        // ─── 分析所有物理页，生成虚拟页映射 ───
        const vp: VirtualPage[] = []
        for (let p = 1; p <= doc.numPages; p++) {
          const page = await doc.getPage(p)
          const vpHeight = page.getViewport({ scale: 1 }).height
          if (vpHeight <= MAX_PAGE_HEIGHT) {
            vp.push({ physical: p, offsetY: 0, height: vpHeight, index: 0 })
          } else {
            const segments = Math.ceil(vpHeight / MAX_PAGE_HEIGHT)
            for (let s = 0; s < segments; s++) {
              const segH = Math.min(MAX_PAGE_HEIGHT, vpHeight - s * MAX_PAGE_HEIGHT)
              vp.push({ physical: p, offsetY: s * MAX_PAGE_HEIGHT, height: segH, index: s })
            }
          }
        }
        vpagesRef.current = vp
        setTotalPages(vp.length)
        setPageInfo(
          doc.numPages === vp.length
            ? ''
            : `（共 ${doc.numPages} 页，因高度过大切分为 ${vp.length} 屏）`
        )

        // 异步回写页数
        const bookId = pdfUrl.split('/').pop()?.replace('.pdf', '')
        if (bookId && doc.numPages > 0) {
          fetch(`/api/books/${bookId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pages: doc.numPages }),
          }).catch(() => {})
        }
      } catch (e) {
        if (!cancelled) {
          setLoading(false)
          setError('样册加载失败，请检查文件是否完整或网络连接')
        }
      }
    }
    loadPDF()
    return () => { cancelled = true }
  }, [pdfUrl])

  // ─── 渲染页面到 Canvas（支持虚拟页裁剪 + 缓存） ───
  const renderToCanvas = useCallback(async (
    vpageIndex: number,
    canvas: HTMLCanvasElement
  ): Promise<boolean> => {
    const vp = vpagesRef.current[vpageIndex - 1]
    if (!pdfDoc || !vp) return false

    const cacheKey = `${vp.physical}@${vp.offsetY}`

    try {
      const ctx = canvas.getContext('2d')!
      const cached = pageCacheRef.current.get(cacheKey)

      if (cached) {
        canvas.width = cached.width
        canvas.height = cached.height
        ctx.putImageData(cached, 0, 0)
        return true
      }

      // 渲染物理页——但只截取对应的 Y 片段
      const page = await pdfDoc.getPage(vp.physical)
      const fullVp = page.getViewport({ scale })
      const renderHeight = vp.height * scale

      // 如果不需要裁剪，直接渲染
      if (vp.offsetY === 0 && vp.height >= fullVp.height) {
        canvas.width = Math.ceil(fullVp.width)
        canvas.height = Math.ceil(fullVp.height)
        await page.render({ canvasContext: ctx, viewport: fullVp }).promise
      } else {
        // 需要裁剪：渲染到离屏 canvas，再截取片段
        const offscreen = document.createElement('canvas')
        offscreen.width = Math.ceil(fullVp.width)
        offscreen.height = Math.ceil(renderHeight)
        const offCtx = offscreen.getContext('2d')!

        // 用 transform 偏移视口来只渲染需要的片段
        const segmentVp = page.getViewport({
          scale,
          offsetX: 0,
          offsetY: -vp.offsetY,
        })
        // 画布只取片段高度
        offscreen.width = Math.ceil(segmentVp.width)
        offscreen.height = Math.ceil(renderHeight)
        await page.render({ canvasContext: offCtx, viewport: segmentVp }).promise

        canvas.width = offscreen.width
        canvas.height = offscreen.height
        ctx.drawImage(offscreen, 0, 0)
      }

      // ─── 灰度暖色增强 ───
      applyWarmthEnhance(ctx, canvas.width, canvas.height)

      // 存入缓存
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      pageCacheRef.current.set(cacheKey, imageData)

      return true
    } catch {
      return false
    }
  }, [pdfDoc, scale])

  // ─── 预加载相邻虚拟页 ───
  const preloadNeighbors = useCallback(async (vpageIndex: number) => {
    if (!pdfDoc || vpagesRef.current.length < 2) return
    const neighbors = [vpageIndex + 1, vpageIndex - 1].filter(
      p => {
        const vp = vpagesRef.current[p - 1]
        if (!vp) return false
        const key = `${vp.physical}@${vp.offsetY}`
        return !pageCacheRef.current.has(key) && !preloadingRef.current.has(key)
      }
    )
    for (const p of neighbors) {
      const vp = vpagesRef.current[p - 1]
      const key = `${vp.physical}@${vp.offsetY}`
      preloadingRef.current.add(key)
      try {
        const offscreen = document.createElement('canvas')
        await renderToCanvas(p, offscreen)
      } catch { /* ok */ }
      preloadingRef.current.delete(key)
    }
  }, [pdfDoc, renderToCanvas])

  // ─── 渲染当前虚拟页 ───
  useEffect(() => {
    if (!pdfDoc || !mainCanvasRef.current) return

    if (skipNextRenderRef.current) {
      skipNextRenderRef.current = false
      return
    }

    let cancelled = false
    setLoading(true)
    setShowJump(false)

    renderToCanvas(currentPage, mainCanvasRef.current).then(() => {
      if (!cancelled) {
        setLoading(false)
        preloadNeighbors(currentPage)
      }
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

    const targetPage = direction === 'next' ? currentPage + 1 : currentPage - 1
    if (targetPage < 1 || targetPage > totalPages) return

    turningRef.current = true
    setTurning(true)
    turnDirRef.current = direction

    await renderToCanvas(targetPage, nextCanvasRef.current)

    if (!turningRef.current) {
      const main = mainCanvasRef.current!
      const next = nextCanvasRef.current!
      const ctx = main.getContext('2d')!
      ctx.clearRect(0, 0, main.width, main.height)
      main.width = next.width
      main.height = next.height
      ctx.drawImage(next, 0, 0)
      skipNextRenderRef.current = true
      setTurning(false)
      setCurrentPage(targetPage)
      return
    }

    const wrap = clipWrapRef.current
    const isNext = direction === 'next'
    const startClip = 'inset(0 0% 0 0)'
    const endClip = isNext ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)'

    wrap.style.transition = 'none'
    wrap.style.clipPath = startClip
    void wrap.offsetHeight

    wrap.style.transition = 'clip-path 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
    wrap.style.clipPath = endClip

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        if (!turningRef.current) { resolve(); return }
        const main = mainCanvasRef.current!
        const next = nextCanvasRef.current!
        const ctx = main.getContext('2d')!
        ctx.clearRect(0, 0, main.width, main.height)
        main.width = next.width
        main.height = next.height
        ctx.drawImage(next, 0, 0)
        wrap.style.transition = 'none'
        wrap.style.clipPath = startClip
        skipNextRenderRef.current = true
        setTurning(false)
        setCurrentPage(targetPage)
        turningRef.current = false
        resolve()
      }, 380)
    })
  }, [pdfDoc, currentPage, totalPages, renderToCanvas])

  goNextRef.current = useCallback(() => turnPage('next'), [turnPage])
  goPrevRef.current = useCallback(() => turnPage('prev'), [turnPage])
  const goNext = useCallback(() => goNextRef.current(), [])
  const goPrev = useCallback(() => goPrevRef.current(), [])

  // ─── 键盘 ───
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNextRef.current()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrevRef.current()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const zoomIn = () => setScale(s => Math.min(s + 0.25, 3))
  const zoomOut = () => setScale(s => Math.max(s - 0.25, 0.5))
  const resetView = () => { setCurrentPage(1); setScale(1.5) }

  // ─── 点击翻页 ───
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (touchSwipedRef.current) { touchSwipedRef.current = false; return }
    if (turning) return
    const rect = scrollRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    if (x < rect.width * 0.35) goPrev()
    else if (x > rect.width * 0.65) goNext()
  }

  // ─── 触摸 ───
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    touchSwipedRef.current = false
  }
  const onTouchMove = (e: React.TouchEvent) => {
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current)
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current)
    if (dx > 10 || dy > 10) touchSwipedRef.current = true
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchSwipedRef.current) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx > 0) goPrev(); else goNext()
    }
  }

  // ─── 跳页 ───
  const handleJump = (e: React.FormEvent) => {
    e.preventDefault()
    const p = parseInt(jumpInput)
    if (p >= 1 && p <= totalPages) { setCurrentPage(p); setShowJump(false); setJumpInput('') }
  }

  // ─── 错误状态 ───
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
      {/* ─── 工具栏 ─── */}
      <header className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-800/50 px-3 py-1.5
                      flex items-center justify-between shrink-0 gap-1 z-30">
        <div className="flex items-center gap-0.5">
          <button onClick={goPrev} disabled={currentPage <= 1 || turning}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg
                      disabled:opacity-20 transition-all active:scale-90" title="上一页 (←)">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="relative mx-0.5">
            <button onClick={() => { setShowJump(true); setTimeout(() => jumpInputRef.current?.focus(), 50) }}
              className="px-2.5 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-white/10
                        rounded-lg transition-all font-medium tabular-nums min-w-[80px] text-center">
              <span className="text-white">{currentPage}</span>
              <span className="text-gray-600 mx-0.5">/</span>
              <span className="text-gray-500">{totalPages}</span>
            </button>
            {showJump && (
              <form onSubmit={handleJump}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-gray-800 border border-gray-700
                          rounded-xl p-2 shadow-2xl z-50 flex items-center gap-1.5"
                onKeyDown={e => { if (e.key === 'Escape') { setShowJump(false); setJumpInput('') } }}>
                <input ref={jumpInputRef} type="number" min={1} max={totalPages}
                  value={jumpInput} onChange={e => setJumpInput(e.target.value)}
                  className="w-18 px-2 py-1.5 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm
                            text-center focus:outline-none focus:border-blue-500
                            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                            [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="页数" autoFocus />
                <button type="submit" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm
                                                  rounded-lg transition-all active:scale-90 font-medium">
                  跳转
                </button>
              </form>
            )}
          </div>

          <button onClick={goNext} disabled={currentPage >= totalPages || turning}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg
                      disabled:opacity-20 transition-all active:scale-90" title="下一页 (→)">
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
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all active:scale-90 disabled:opacity-20"
            title="缩小">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
            </svg>
          </button>
          <span className="text-xs text-gray-400 w-12 text-center tabular-nums font-medium">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} disabled={scale >= 3 || turning}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all active:scale-90 disabled:opacity-20"
            title="放大">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <div className="w-px h-5 bg-gray-700/50 mx-0.5" />
          <button onClick={resetView} disabled={turning}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all active:scale-90 disabled:opacity-20"
            title="重置">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </header>

      {/* ─── 分页提示 ─── */}
      {pageInfo && (
        <div className="bg-blue-900/30 border-b border-blue-800/30 px-3 py-1 text-center">
          <span className="text-xs text-blue-300">{pageInfo}</span>
        </div>
      )}

      {/* ─── PDF 画布 + 翻页动画 ─── */}
      <div ref={scrollRef}
        className="flex-1 overflow-auto flex justify-center bg-[#1a1a2e]"
        onClick={handleCanvasClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
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
              <canvas ref={nextCanvasRef}
                className="shadow-2xl rounded-sm"
                style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
            </div>

            <div ref={clipWrapRef}
              className="row-start-1 col-start-1"
              style={{ gridArea: '1/1', clipPath: 'inset(0 0% 0 0)' }}
            >
              <canvas ref={mainCanvasRef}
                className="shadow-2xl rounded-sm"
                style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />

              <div className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.03) 50%, rgba(0,0,0,0.06) 100%)',
                  clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
                }}>
                <div className="absolute bottom-0 right-0 w-12 h-12"
                  style={{
                    background: 'linear-gradient(315deg, transparent 40%, rgba(255,255,255,0.02) 100%)',
                    clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
                  }} />
              </div>

              <div className="absolute top-0 bottom-0 w-10 pointer-events-none z-10"
                style={{ right: 0, background: 'linear-gradient(to left, rgba(0,0,0,0.08), transparent)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── 底部操作提示 ─── */}
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

// ─── 灰度/浅色页暖色增强 ───
function applyWarmthEnhance(ctx: CanvasRenderingContext2D, w: number, h: number) {
  try {
    const data = ctx.getImageData(0, 0, w, h)
    const pixels = data.data
    let grayCount = 0, total = 0
    // 先采样判断是否主要为灰度
    for (let i = 0; i < pixels.length; i += 4 * 8) {
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2]
      if (Math.abs(r - g) < 4 && Math.abs(g - b) < 4) grayCount++
      total++
    }
    if (grayCount / total < 0.85) return // 彩色页不做暖色处理

    // 灰度页：微调 RGB 通道添加暖色调
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2]
      pixels[i] = Math.min(255, r * WARMTH.r)
      pixels[i + 1] = Math.min(255, g * WARMTH.g)
      pixels[i + 2] = Math.min(255, b * WARMTH.b)
    }
    ctx.putImageData(data, 0, 0)
  } catch {
    // canvas tainted（跨域图片等）→ 跳过
  }
}
