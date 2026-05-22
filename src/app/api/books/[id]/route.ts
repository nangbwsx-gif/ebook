import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { unlink } from 'fs/promises'
import path from 'path'

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const book = await prisma.book.findUnique({
    where: { id: params.id },
    include: { category: true },
  })
  if (!book) return NextResponse.json({ error: '未找到' }, { status: 404 })
  return NextResponse.json(book)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const data = await request.json()
  const book = await prisma.book.update({
    where: { id: params.id },
    data: {
      title: data.title,
      description: data.description,
      pages: data.pages,
    },
  })
  return NextResponse.json(book)
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const book = await prisma.book.findUnique({ where: { id: params.id } })
  if (!book) return NextResponse.json({ error: '未找到' }, { status: 404 })

  // 删除PDF文件
  try {
    const filePath = path.join(process.cwd(), 'public', book.pdfUrl)
    await unlink(filePath)
  } catch {
    // 文件可能不存在，忽略
  }

  await prisma.book.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
