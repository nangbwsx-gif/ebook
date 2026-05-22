import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value
  if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 })

  try {
    const data = JSON.parse(Buffer.from(token, 'base64').toString())
    const user = await prisma.user.findUnique({ where: { id: data.id } })
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 401 })
    return NextResponse.json({ username: user.username, slug: user.slug, role: user.role })
  } catch {
    return NextResponse.json({ error: '无效token' }, { status: 401 })
  }
}
