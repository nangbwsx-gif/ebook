import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// 获取书橱的公开书籍（通过 slug）
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')

  if (slug) {
    // 公开访问：通过书橱slug查看书籍
    const user = await prisma.user.findUnique({ where: { slug } })
    if (!user) return NextResponse.json({ error: '书橱不存在' }, { status: 404 })
    const books = await prisma.book.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    })
    return NextResponse.json(books)
  }

  // 需要登录：返回当前用户的书籍
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const books = await prisma.book.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { category: true },
  })
  return NextResponse.json(books)
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string
    const description = formData.get('description') as string || ''
    const categoryName = formData.get('category') as string || ''

    if (!file || !title) {
      return NextResponse.json({ error: '缺少文件或标题' }, { status: 400 })
    }

    if (!file.name.endsWith('.pdf')) {
      return NextResponse.json({ error: '只支持PDF文件' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = `${uuidv4()}.pdf`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })
    await writeFile(path.join(uploadDir, fileName), buffer)

    // 处理分类（用户级别）
    let categoryId: string | null = null
    if (categoryName) {
      let category = await prisma.category.findFirst({
        where: { name: categoryName, userId: user.id },
      })
      if (!category) {
        category = await prisma.category.create({
          data: { name: categoryName, userId: user.id },
        })
      }
      categoryId = category.id
    }

    const book = await prisma.book.create({
      data: {
        title,
        description,
        pdfUrl: `/uploads/${fileName}`,
        pages: 0,
        categoryId,
        userId: user.id,
      },
      include: { category: true },
    })

    return NextResponse.json(book)
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: '上传失败' }, { status: 500 })
  }
}
