import { prisma } from '@/lib/db'
import PDFViewer from '@/components/PDFViewer'
import Link from 'next/link'

export default async function BookPage({ params }: { params: { id: string } }) {
  const book = await prisma.book.findUnique({ where: { id: params.id } })
  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-400 mb-4">样册未找到</p>
          <Link href="/" className="text-blue-500 hover:underline">返回首页</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* 顶部导航 */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 h-14 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-white font-medium truncate max-w-md">{book.title}</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>{book.pages} 页</span>
        </div>
      </header>

      {/* PDF 阅读器 */}
      <div className="flex-1">
        <PDFViewer pdfUrl={book.pdfUrl} />
      </div>
    </div>
  )
}
