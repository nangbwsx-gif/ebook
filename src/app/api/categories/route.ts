import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')

  if (slug) {
    const user = await prisma.user.findUnique({ where: { slug } })
    if (!user) return NextResponse.json({ error: '书橱不存在' }, { status: 404 })
    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      include: { _count: { select: { books: true } } },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(categories)
  }

  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    include: { _count: { select: { books: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(categories)
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const { name } = await request.json()
  const category = await prisma.category.create({
    data: { name, userId: user.id },
  })
  return NextResponse.json(category)
}
