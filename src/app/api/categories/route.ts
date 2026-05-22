import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { books: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(categories)
}

export async function POST(request: Request) {
  const { name } = await request.json()
  const category = await prisma.category.create({ data: { name } })
  return NextResponse.json(category)
}
