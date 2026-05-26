import { prisma } from '@/lib/db'
import BookcaseContent from '@/components/BookcaseContent'
import Header from '@/components/Header'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function BookcasePage({ params }: { params: { slug: string } }) {
  const user = await prisma.user.findUnique({ where: { slug: params.slug } })

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <p className="text-xl text-gray-400 mb-4">书橱不存在</p>
          <Link href="/" className="text-blue-500 hover:underline">返回首页</Link>
        </div>
      </div>
    )
  }

  const [books, categories] = await Promise.all([
    prisma.book.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.findMany({
      where: { userId: user.id },
      include: { books: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="bookshelf-container">
      <Header showSlug={user.slug} />
      <main className="max-w-7xl mx-auto px-4 pb-20">
        <BookcaseContent books={books} categories={categories} />
      </main>
    </div>
  )
}
