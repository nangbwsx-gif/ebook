import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/token'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value
  if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: '无效token' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: payload.id } })
  if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 401 })

  return NextResponse.json({ username: user.username, slug: user.slug, role: user.role })
}
