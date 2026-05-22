import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  const books = await prisma.book.findMany({
    orderBy: { createdAt: 'desc' },
    include: { category: true },
  })
  return NextResponse.json(books)
}

export async function POST(request: NextRequest) {
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

    // 保存PDF文件
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = `${uuidv4()}.pdf`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })
    const filePath = path.join(uploadDir, fileName)
    await writeFile(filePath, buffer)

    // 处理分类
    let categoryId: string | null = null
    if (categoryName) {
      let category = await prisma.category.findUnique({ where: { name: categoryName } })
      if (!category) {
        category = await prisma.category.create({ data: { name: categoryName } })
      }
      categoryId = category.id
    }

    // 创建数据库记录
    const book = await prisma.book.create({
      data: {
        title,
        description,
        pdfUrl: `/uploads/${fileName}`,
        pages: 0, // 稍后可通过pdf.js计算
        categoryId,
      },
      include: { category: true },
    })

    return NextResponse.json(book)
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: '上传失败' }, { status: 500 })
  }
}
