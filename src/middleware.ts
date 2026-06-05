import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 简易内存速率限制（单机运行足够）
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

const WINDOW_MS = 60_000   // 1 分钟窗口
const MAX_REQUESTS = 30    // 每分钟每 IP 最多 30 次

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // 安全头
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // 速率限制（仅 API 路由）
  if (request.nextUrl.pathname.startsWith('/api/auth') || request.nextUrl.pathname.startsWith('/api/books')) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const now = Date.now()
    const entry = rateLimitMap.get(ip)

    if (entry && now < entry.resetAt) {
      if (entry.count >= MAX_REQUESTS) {
        return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 })
      }
      entry.count++
    } else {
      rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    }

    // 定期清理过期条目
    if (rateLimitMap.size > 10000) {
      rateLimitMap.forEach((v, k) => {
        if (now > v.resetAt) rateLimitMap.delete(k)
      })
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|/uploads/).*)'],
}
