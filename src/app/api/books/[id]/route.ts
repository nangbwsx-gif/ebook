import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { unlink } from 'fs/promises'
import path from 'path'

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const book = await prisma.book.findUnique({
    where: { id: params.id },
    include: { category: true, user: { select: { slug: true } } },
  })
  if (!book) return NextResponse.json({ error: '未找到' }, { status: 404 })
  return NextResponse.json(book)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const book = await prisma.book.findUnique({ where: { id: params.id } })
  if (!book || book.userId !== user.id) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const data = await request.json()
  const updated = await prisma.book.update({
    where: { id: params.id },
    data: { title: data.title, description: data.description, pages: data.pages },
  })
  return NextResponse.json(updated)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const book = await prisma.book.findUnique({ where: { id: params.id } })
  if (!book || book.userId !== user.id) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  try {
    const filePath = path.join(process.cwd(), 'public', book.pdfUrl)
    await unlink(filePath)
  } catch { /* 文件可能不存在 */ }

  await prisma.book.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
