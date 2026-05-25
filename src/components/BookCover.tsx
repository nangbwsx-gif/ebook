import Link from 'next/link'
import PDFCover from './PDFCover'

interface BookCoverProps {
  id: string
  title: string
  coverUrl: string | null
  pdfUrl?: string
  pages: number
  updatedAt: Date
}

export default function BookCover({ id, title, coverUrl, pdfUrl, pages, updatedAt }: BookCoverProps) {
  const timeAgo = getTimeAgo(new Date(updatedAt))

  return (
    <Link href={`/book/${id}`} data-book-card data-title={title}>
      <div className="book-cover group cursor-pointer">
        {/* 书本3D立体效果 */}
        <div className="relative perspective-[800px]">
          {/* 书脊 */}
          <div className="absolute -right-1 top-0 w-2 h-full bg-gradient-to-r from-gray-700 to-gray-600 rounded-r-sm transform skew-y-1 origin-left" />
          {/* 封面 */}
          <div className="relative w-full aspect-[3/4] rounded-sm overflow-hidden shadow-lg bg-gray-800">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : pdfUrl ? (
              <PDFCover pdfUrl={pdfUrl} bookId={id} title={title} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900 p-4">
                <svg className="w-12 h-12 text-blue-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-sm text-center text-blue-200 font-medium leading-tight">
                  {title}
                </span>
              </div>
            )}
            {/* 悬浮层 */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="bg-blue-600 text-white text-sm px-4 py-2 rounded-full">点击阅读</span>
            </div>
          </div>
        </div>

        {/* 书籍信息 */}
        <div className="mt-3 text-center">
          <h3 className="text-sm font-medium text-gray-200 truncate" title={title}>
            {title}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {pages} 页 · {timeAgo}
          </p>
        </div>
      </div>
    </Link>
  )
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days < 1) return '今天'
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  if (days < 365) return `${Math.floor(days / 30)}个月前`
  return `${Math.floor(days / 365)}年前`
}
