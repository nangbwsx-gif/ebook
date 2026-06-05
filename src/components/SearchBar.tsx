'use client'

import { useState, useCallback } from 'react'

export default function SearchBar({ onSearch, bookCount }: { onSearch?: (query: string) => void; bookCount?: number }) {
  const [query, setQuery] = useState('')

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    onSearch?.(value)
  }, [onSearch])

  return (
    <div className="flex flex-col items-center py-10">
      <div className="relative w-full max-w-lg">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder={bookCount ? `搜索 ${bookCount} 本样册...` : '搜索样册...'}
          className="w-full pl-12 pr-12 py-3.5 bg-white/[0.06] backdrop-blur-sm border border-white/[0.08]
                     rounded-2xl text-white placeholder-gray-600
                     focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08]
                     transition-all duration-300 text-sm"
        />
        {query && (
          <button onClick={() => { setQuery(''); onSearch?.('') }}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {query && (
        <p className="text-xs text-gray-600 mt-3 animate-fade-in-up">
          搜索 &ldquo;{query}&rdquo; 的结果
        </p>
      )}
    </div>
  )
}
