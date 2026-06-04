'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export interface Book {
  id: string; title: string; description: string | null; coverUrl: string | null
  pdfUrl: string; pages: number; createdAt: string
  category: { id: string; name: string } | null
}
export interface Category {
  id: string; name: string; _count: { books: number }
}
interface User { username: string; slug: string }

interface DashCtx {
  user: User | null; books: Book[]; categories: Category[]
  loading: boolean; bookcaseUrl: string
  refresh: () => void
}

const Ctx = createContext<DashCtx>({ user:null, books:[], categories:[], loading:true, bookcaseUrl:'', refresh:()=>{} })
export const useDashboard = () => useContext(Ctx)

export default function DashboardProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refresh = useCallback(async () => {
    const [userRes, booksRes, catsRes] = await Promise.all([
      fetch('/api/auth/check'),
      fetch('/api/books'),
      fetch('/api/categories'),
    ])
    if (!userRes.ok) { router.push('/admin/login'); return }
    setUser(await userRes.json())
    if (booksRes.ok) setBooks(await booksRes.json())
    if (catsRes.ok) setCategories(await catsRes.json())
    setLoading(false)
  }, [router])

  useEffect(() => { refresh() }, [refresh])

  return (
    <Ctx.Provider value={{
      user, books, categories, loading,
      bookcaseUrl: `/bookcase/${user?.slug}`,
      refresh,
    }}>
      {children}
    </Ctx.Provider>
  )
}
