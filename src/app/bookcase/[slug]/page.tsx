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

  // 一次性查询：category.include.books 已包含书籍，不再重复查询
  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    include: { books: { orderBy: { createdAt: 'desc' } } },
    orderBy: { name: 'asc' },
  })

  // 从 categories 中提取所有书籍（已通过 include 加载）
  const books = categories.flatMap(c => c.books)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="bookshelf-container bg-gray-950">
      {/* 环境光标亮 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-600/[0.04] rounded-full blur-3xl" />
      </div>
      <Header showSlug={user.slug} />
      <main className="max-w-7xl mx-auto px-6 pb-24 relative">
        <BookcaseContent books={books} categories={categories} />
      </main>
    </div>
  )
}
