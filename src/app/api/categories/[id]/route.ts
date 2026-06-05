import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const category = await prisma.category.findUnique({ where: { id: params.id } })
  if (!category || category.userId !== user.id) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const { name } = await request.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: '分类名不能为空' }, { status: 400 })
  }

  // 检查同名分类
  const existing = await prisma.category.findFirst({
    where: { name: name.trim(), userId: user.id, id: { not: params.id } },
  })
  if (existing) {
    return NextResponse.json({ error: '分类名已存在' }, { status: 400 })
  }

  const updated = await prisma.category.update({
    where: { id: params.id },
    data: { name: name.trim() },
  })
  return NextResponse.json(updated)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const category = await prisma.category.findUnique({ where: { id: params.id } })
  if (!category || category.userId !== user.id) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  // 将该分类下的书籍置为未分类
  await prisma.book.updateMany({
    where: { categoryId: params.id },
    data: { categoryId: null },
  })

  await prisma.category.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
