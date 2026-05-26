'use client'

import { useState } from 'react'
import SearchBar from './SearchBar'
import BookShelf from './BookShelf'

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

export default function BookcaseContent({ books, categories }: { books: Book[]; categories: Category[] }) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredBooks = searchQuery
    ? books.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : books

  return (
    <>
      <SearchBar onSearch={setSearchQuery} />
      <BookShelf books={filteredBooks} categories={categories} />
    </>
  )
}
