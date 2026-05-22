import BookCover from './BookCover'

interface Book {
  id: string
  title: string
  coverUrl: string | null
  pdfUrl: string
  pages: number
  updatedAt: Date
  categoryId: string | null
}

interface Category {
  id: string
  name: string
  books: Book[]
}

export default function BookShelf({ books, categories }: { books: Book[]; categories: Category[] }) {
  if (books.length === 0) {
    return (
      <div className="text-center py-20">
        <svg className="w-20 h-20 mx-auto text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <p className="text-gray-500 text-lg">暂无样册</p>
        <p className="text-gray-600 text-sm mt-2">请通过管理后台上传PDF样册</p>
      </div>
    )
  }

  // 如果有分类，按分类展示
  if (categories.length > 0) {
    return (
      <div className="space-y-12">
        {categories.map((category) => (
          <section key={category.id}>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-5 w-1 bg-blue-500 rounded-full" />
              <h2 className="text-lg font-bold text-white">{category.name}</h2>
              <span className="text-sm text-gray-500">({category.books.length}本)</span>
            </div>
            {/* 书架木板背景 */}
            <div className="shelf-board rounded-lg p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {category.books.map((book) => (
                  <BookCover key={book.id} {...book} />
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    )
  }

  // 无分类时直接网格展示
  return (
    <div className="shelf-board rounded-lg p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {books.map((book) => (
          <BookCover key={book.id} {...book} />
        ))}
      </div>
    </div>
  )
}
