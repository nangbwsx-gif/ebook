import Link from 'next/link'
import PDFCover from './PDFCover'

interface BookCoverProps {
  id: string
  title: string
  coverUrl: string | null
  pdfUrl?: string
  pages: number
  updatedAt: Date
  index?: number
}

export default function BookCover({ id, title, coverUrl, pdfUrl, pages, updatedAt, index = 0 }: BookCoverProps) {
  const timeAgo = getTimeAgo(new Date(updatedAt))

  return (
    <Link href={`/book/${id}`} data-book-card data-title={title}
      className="block animate-fade-in-up focus:outline-none"
      style={{ animationDelay: `${index * 80}ms` }}>
      <div className="book-cover group cursor-pointer">
        {/* 书本3D立体效果 */}
        <div className="relative">
          {/* 书本阴影 */}
          <div className="absolute -inset-x-1 bottom-0 h-4 bg-black/30 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* 书脊 */}
          <div className="absolute -right-1 top-0 w-1.5 h-full bg-gradient-to-r from-gray-600 to-gray-500 rounded-r-sm
                        transform -skew-y-1 origin-left opacity-80 group-hover:opacity-100 transition-opacity" />

          {/* 封面 */}
          <div className="cover-shine relative w-full aspect-[3/4] rounded-md overflow-hidden
                        shadow-xl shadow-black/30 group-hover:shadow-2xl group-hover:shadow-black/50
                        transition-all duration-500 bg-gray-800"
               style={{
                 backgroundImage: !coverUrl && !pdfUrl
                   ? 'linear-gradient(135deg, #1e3a5f 0%, #1a2744 30%, #1e3a5f 60%, #2d1b69 100%)'
                   : undefined,
               }}>
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
            ) : pdfUrl ? (
              <div className="w-full h-full">
                <PDFCover pdfUrl={pdfUrl} bookId={id} title={title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4">
                <svg className="w-10 h-10 text-white/30 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-xs text-center text-white/50 font-medium leading-tight truncate w-full px-2">
                  {title}
                </span>
              </div>
            )}

            {/* 悬浮遮罩 */}
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 via-transparent to-transparent
                          opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center pb-6">
              <span className="px-4 py-2 bg-white/20 backdrop-blur-md text-white text-xs font-medium rounded-full
                             border border-white/20 shadow-lg translate-y-4 group-hover:translate-y-0
                             transition-transform duration-500">
                点击阅读 →
              </span>
            </div>

            {/* 页码角标 */}
            <div className="absolute top-2 right-2">
              <span className="px-2 py-0.5 bg-black/40 backdrop-blur-sm rounded-md text-[10px] text-white/60 font-medium
                             border border-white/[0.06]">
                {pages > 0 ? `${pages}p` : 'NEW'}
              </span>
            </div>
          </div>
        </div>

        {/* 书籍信息 */}
        <div className="mt-3 text-center">
          <h3 className="text-sm font-medium text-gray-300 truncate group-hover:text-white transition-colors px-1" title={title}>
            {title}
          </h3>
          <p className="text-[11px] text-gray-600 mt-1">
            {pages > 0 ? `${pages} 页 · ` : ''}{timeAgo}
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
