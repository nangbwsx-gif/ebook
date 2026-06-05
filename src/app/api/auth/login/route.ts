import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { signToken } from '@/lib/token'

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()

  if (!username || !password) {
    return NextResponse.json({ error: '请输入用户名和密码' }, { status: 400 })
  }

  // 防用户枚举：bcrypt 固定耗时
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) {
    bcrypt.hashSync('placeholder', 10) // 延时防止时序攻击
    return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
  }

  const valid = bcrypt.compareSync(password, user.password)
  if (!valid) {
    return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
  }

  const token = signToken({ id: user.id, username: user.username })

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
