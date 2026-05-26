import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  const { username, password, slug } = await request.json()

  if (!username || !password || !slug) {
    return NextResponse.json({ error: '请填写用户名、密码和书橱标识' }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: '密码长度至少6位' }, { status: 400 })
  }

  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) || slug.length < 3) {
    return NextResponse.json({ error: '书橱标识格式不正确（3位以上，仅字母数字和横线）' }, { status: 400 })
  }

  // 检查用户名和slug唯一性
  const [existingUser, existingSlug] = await Promise.all([
    prisma.user.findUnique({ where: { username } }),
    prisma.user.findUnique({ where: { slug } }),
  ])

  if (existingUser) {
    return NextResponse.json({ error: '用户名已存在' }, { status: 400 })
  }
  if (existingSlug) {
    return NextResponse.json({ error: '书橱标识已被占用' }, { status: 400 })
  }

  const user = await prisma.user.create({
    data: {
      username,
      password: bcrypt.hashSync(password, 10),
      slug,
      role: 'USER',
    },
  })

  const token = Buffer.from(JSON.stringify({ id: user.id, username: user.username })).toString('base64')

  const response = NextResponse.json({
    success: true,
    user: { username: user.username, slug: user.slug },
  })
  response.cookies.set('admin_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  })

  return response
}
