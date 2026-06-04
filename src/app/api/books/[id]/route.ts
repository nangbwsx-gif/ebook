import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { unlink, writeFile, mkdir } from 'fs/promises'
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

  // 更新封面图片
  if (data.coverData) {
    const coverDir = path.join(process.cwd(), 'public', 'uploads', 'covers')
    await mkdir(coverDir, { recursive: true })
    const coverFileName = `${params.id}.jpg`
    const coverPath = path.join(coverDir, coverFileName)
    const base64Data = data.coverData.replace(/^data:image\/\w+;base64,/, '')
    await writeFile(coverPath, Buffer.from(base64Data, 'base64'))
    data.coverUrl = `/uploads/covers/${coverFileName}`
  }

  const updateFields: Record<string, unknown> = {}
  if (data.title !== undefined) updateFields.title = data.title
  if (data.description !== undefined) updateFields.description = data.description
  if (data.pages !== undefined) updateFields.pages = data.pages
  if (data.coverUrl !== undefined) updateFields.coverUrl = data.coverUrl
  if (data.categoryId !== undefined) updateFields.categoryId = data.categoryId

  const updated = await prisma.book.update({
    where: { id: params.id },
    data: updateFields,
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

  // 清理封面文件
  if (book.coverUrl) {
    try {
      const coverPath = path.join(process.cwd(), 'public', book.coverUrl)
      await unlink(coverPath)
    } catch { /* 封面文件可能不存在 */ }
  }

  await prisma.book.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
