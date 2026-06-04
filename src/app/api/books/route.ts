import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const MAX_FILE_SIZE = 200 * 1024 * 1024 // 200MB

// 验证 PDF 魔数（文件头）
function isValidPDF(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46
}

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
    const categoryName = (formData.get('category') as string || '').trim()

    if (!file || !title) {
      return NextResponse.json({ error: '缺少文件或标题' }, { status: 400 })
    }

    // 文件大小限制
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '文件超过 200MB 限制' }, { status: 400 })
    }

    if (!file.name.endsWith('.pdf')) {
      return NextResponse.json({ error: '只支持PDF文件' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // 验证 PDF 魔数
    if (!isValidPDF(buffer)) {
      return NextResponse.json({ error: '无效的 PDF 文件' }, { status: 400 })
    }

    const fileName = `${uuidv4()}.pdf`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })
    await writeFile(path.join(uploadDir, fileName), buffer)

    // 处理分类（用户级别）
    let categoryId: string | null = null
    if (categoryName) {
      // 使用 upsert 避免竞态条件
      const category = await prisma.category.upsert({
        where: { name_userId: { name: categoryName, userId: user.id } },
        update: {},
        create: { name: categoryName, userId: user.id },
      })
      categoryId = category.id
    }

    // 页数由客户端首次打开时回写，上传时不再解析（避免加载 ~8MB pdfjs-dist）
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
