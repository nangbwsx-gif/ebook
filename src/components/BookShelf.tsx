import BookCover from './BookCover'

interface Book {
  id: string; title: string; coverUrl: string | null
  pdfUrl: string; pages: number; updatedAt: Date
  categoryId: string | null
}
interface Category {
  id: string; name: string; books: Book[]
}

export default function BookShelf({ books, categories }: { books: Book[]; categories: Category[] }) {
  if (books.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="animate-float inline-block">
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>
        <h3 className="text-white/60 text-lg font-medium mb-2">暂无样册</h3>
        <p className="text-gray-600 text-sm">用户尚未上传任何样册</p>
      </div>
    )
  }

  const categorizedBookIds = new Set(categories.flatMap(c => c.books.map(b => b.id)))
  const uncategorizedBooks = books.filter(b => !categorizedBookIds.has(b.id))
  let globalIndex = 0

  return (
    <div className="space-y-14">
      {/* 类别区域 */}
      {categories.map(category => (
        <section key={category.id}>
          <div className="flex items-center gap-4 mb-7 pl-1">
            <div className="flex items-center gap-3">
              <div className="h-7 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full shadow-lg shadow-blue-500/20" />
              <h2 className="text-xl font-bold text-white tracking-tight">{category.name}</h2>
            </div>
            <span className="text-sm text-gray-600 bg-white/[0.03] px-3 py-0.5 rounded-full border border-white/[0.05]">
              {category.books.length} 本
            </span>
          </div>
          <div className="shelf-board rounded-2xl p-5 shadow-2xl shadow-black/30">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {category.books.map(book => {
                const idx = globalIndex++
                return <BookCover key={book.id} {...book} index={idx} />
              })}
            </div>
          </div>
        </section>
      ))}

      {/* 未分类 */}
      {uncategorizedBooks.length > 0 && (
        <section>
          <div className="flex items-center gap-4 mb-7 pl-1">
            <div className="flex items-center gap-3">
              <div className="h-7 w-1 bg-gradient-to-b from-gray-500 to-gray-600 rounded-full" />
              <h2 className="text-xl font-bold text-gray-400 tracking-tight">未分类</h2>
            </div>
            <span className="text-sm text-gray-600 bg-white/[0.03] px-3 py-0.5 rounded-full border border-white/[0.05]">
              {uncategorizedBooks.length} 本
            </span>
          </div>
          <div className="rounded-2xl p-5 bg-white/[0.02] border border-white/[0.03]">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {uncategorizedBooks.map(book => {
                const idx = globalIndex++
                return <BookCover key={book.id} {...book} index={idx} />
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
