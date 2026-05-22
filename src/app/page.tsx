import { prisma } from '@/lib/db'
import BookShelf from '@/components/BookShelf'
import SearchBar from '@/components/SearchBar'
import Header from '@/components/Header'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const books = await prisma.book.findMany({ orderBy: { createdAt: 'desc' } })
  const categories = await prisma.category.findMany({ include: { books: true } })

  return (
    <div className="bookshelf-container">
      <Header />
      <main className="max-w-7xl mx-auto px-4 pb-20">
        <SearchBar />
        <BookShelf books={books} categories={categories} />
      </main>
    </div>
  )
}
