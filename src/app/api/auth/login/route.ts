import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'admin123' // 首次运行时自动创建

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()

  if (!username || !password) {
    return NextResponse.json({ error: '请输入用户名和密码' }, { status: 400 })
  }

  // 查找或创建默认管理员
  let user = await prisma.user.findUnique({ where: { username } })
  if (!user && username === ADMIN_USERNAME) {
    user = await prisma.user.create({
      data: {
        username: ADMIN_USERNAME,
        password: bcrypt.hashSync(ADMIN_PASSWORD, 10),
      },
    })
  }

  if (!user) {
    return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
  }

  const valid = bcrypt.compareSync(password, user.password)
  if (!valid) {
    return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
  }

  // 简单的 session token
  const response = NextResponse.json({ success: true, username: user.username })
  response.cookies.set('admin_token', Buffer.from(JSON.stringify({ id: user.id, username })).toString('base64'), {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24小时
  })

  return response
}
