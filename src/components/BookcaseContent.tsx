'use client'

import { useState } from 'react'
import SearchBar from './SearchBar'
import BookShelf from './BookShelf'

interface Book {
  id: string; title: string; coverUrl: string | null
  pdfUrl: string; pages: number; updatedAt: Date
  categoryId: string | null
}
interface Category {
  id: string; name: string; books: Book[]
}

export default function BookcaseContent({ books, categories }: { books: Book[]; categories: Category[] }) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredBooks = searchQuery
    ? books.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : books

  // 搜索时显示平铺，否则按分类
  if (searchQuery) {
    const results = filteredBooks.map((b, i) => ({ ...b, index: i }))
    return (
      <>
        <SearchBar onSearch={setSearchQuery} bookCount={books.length} />
        {results.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-1">未找到匹配的样册</p>
            <p className="text-gray-600 text-sm">试试其他关键词</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 pb-16">
            {results.map(book => (
              <BookCoverWrapper key={book.id} {...book} index={book.index} />
            ))}
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <SearchBar onSearch={setSearchQuery} bookCount={books.length} />
      <BookShelf books={filteredBooks} categories={categories} />
    </>
  )
}

import BookCover from './BookCover'

function BookCoverWrapper(props: Book & { index: number }) {
  return <BookCover {...props} />
}
