import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()

  if (!username || !password) {
    return NextResponse.json({ error: '请输入用户名和密码' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) {
    return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
  }

  const valid = bcrypt.compareSync(password, user.password)
  if (!valid) {
    return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
  }

  const token = Buffer.from(JSON.stringify({ id: user.id, username: user.username })).toString('base64')

  const response = NextResponse.json({
    success: true,
    user: { username: user.username, slug: user.slug, role: user.role },
  })
  response.cookies.set('admin_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  })

  return response
}
