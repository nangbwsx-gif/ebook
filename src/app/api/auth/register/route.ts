import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { signToken } from '@/lib/token'

export async function POST(request: NextRequest) {
  const { username, password, slug } = await request.json()

  if (!username || !password || !slug) {
    return NextResponse.json({ error: '请填写用户名、密码和书橱标识' }, { status: 400 })
  }

  // 用户名校验：2-20个字符，仅允许字母/数字/中文/下划线
  if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]{2,20}$/.test(username || '')) {
    return NextResponse.json({ error: '用户名格式不正确（2-20位，仅允许字母、数字、中文、下划线）' }, { status: 400 })
  }

  if (password.length < 6 || password.length > 128) {
    return NextResponse.json({ error: '密码长度需在6-128位之间' }, { status: 400 })
  }

  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) || slug.length < 3 || slug.length > 30) {
    return NextResponse.json({ error: '书橱标识格式不正确（3-30位，仅字母数字和横线）' }, { status: 400 })
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

  const token = signToken({ id: user.id, username: user.username })

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
