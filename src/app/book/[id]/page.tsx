import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { cache } from 'react'
import PDFViewer from '@/components/PDFViewer'
import Link from 'next/link'
import { Metadata } from 'next'
import { verifyToken } from '@/lib/token'

const getBook = cache(async (id: string) => {
  return prisma.book.findUnique({
    where: { id },
    include: { user: { select: { slug: true } } },
  })
})

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const book = await getBook(params.id)
  return { title: book ? `${book.title} - 电子样册` : '样册未找到' }
}

export default async function BookPage({ params }: { params: { id: string } }) {
  const book = await getBook(params.id)
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

  // 判断是否以管理员身份访问
  const cookieStore = cookies()
  const token = cookieStore.get('admin_token')?.value
  let isOwner = false
  if (token) {
    const payload = verifyToken(token)
    if (payload) isOwner = payload.id === book.userId
  }
  const backUrl = isOwner ? '/dashboard/books' : `/bookcase/${book.user.slug}`

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col">
      {/* 顶部导航 */}
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800/50 px-4 h-12
                        flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={backUrl} className="text-gray-400 hover:text-white transition-colors shrink-0 p-1 -ml-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-white font-medium text-sm truncate">{book.title}</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
          <span>{book.pages} 页</span>
        </div>
      </header>

      {/* PDF 阅读器 */}
      <div className="flex-1 -mt-px">
        <PDFViewer pdfUrl={book.pdfUrl} />
      </div>
    </div>
  )
}
