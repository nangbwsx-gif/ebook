'use client'

import { useState, useCallback } from 'react'

export default function SearchBar({ onSearch }: { onSearch?: (query: string) => void }) {
  const [query, setQuery] = useState('')

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    if (onSearch) {
      onSearch(value)
    } else {
      // 兼容旧用法：直接操作 DOM
      const books = document.querySelectorAll('[data-book-card]')
      books.forEach((book) => {
        const title = book.getAttribute('data-title')?.toLowerCase() || ''
        if (title.includes(value.toLowerCase())) {
          book.classList.remove('hidden')
        } else {
          book.classList.add('hidden')
        }
      })
    }
  }, [onSearch])

  return (
    <div className="py-8">
      <div className="relative max-w-md mx-auto">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="搜索样册..."
          className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
        />
      </div>
    </div>
  )
}
