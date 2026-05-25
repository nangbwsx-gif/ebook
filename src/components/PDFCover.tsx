'use client'

import { useRef, useEffect, useState } from 'react'

export default function PDFCover({ pdfUrl, bookId, title }: { pdfUrl: string; bookId: string; title: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const cachedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    setLoaded(false)
    setError(false)
    cachedRef.current = false

    async function render() {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

        const doc = await pdfjsLib.getDocument(pdfUrl).promise
        if (cancelled) return

        const page = await doc.getPage(1)
        const viewport = page.getViewport({ scale: 0.4 })

        const canvas = canvasRef.current
        if (!canvas) return

        canvas.width = viewport.width
        canvas.height = viewport.height

        await page.render({
          canvasContext: canvas.getContext('2d')!,
          viewport,
        }).promise

        if (cancelled) return
        setLoaded(true)

        // 缓存到服务端（只做一次）
        if (!cachedRef.current) {
          cachedRef.current = true
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
          fetch(`/api/books/${bookId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ coverData: dataUrl }),
          }).catch(() => {})
        }
      } catch {
        if (!cancelled) setError(true)
      }
    }

    render()
    return () => { cancelled = true }
  }, [pdfUrl, bookId])

  if (error) return null

  return (
    <>
      {!loaded && <CoverPlaceholder title={title} />}
      <canvas
        ref={canvasRef}
        style={{
          display: loaded ? 'block' : 'none',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </>
  )
}

function CoverPlaceholder({ title }: { title: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900 p-4">
      <svg className="w-10 h-10 text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      <span className="text-xs text-center text-blue-200 font-medium leading-tight">{title}</span>
    </div>
  )
}
