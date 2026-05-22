import { NextRequest } from 'next/server'
import { prisma } from './db'

export interface AuthUser {
  id: string
  username: string
  slug: string
  role: string
}

export async function getCurrentUser(request: NextRequest): Promise<AuthUser | null> {
  const token = request.cookies.get('admin_token')?.value
  if (!token) return null

  try {
    const data = JSON.parse(Buffer.from(token, 'base64').toString())
    const user = await prisma.user.findUnique({ where: { id: data.id } })
    if (!user) return null
    return {
      id: user.id,
      username: user.username,
      slug: user.slug,
      role: user.role,
    }
  } catch {
    return null
  }
}

export function setAuthCookie(response: Response, user: { id: string; username: string }) {
  const token = Buffer.from(JSON.stringify({ id: user.id, username: user.username })).toString('base64')
  ;(response as any).cookies?.set?.('admin_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
  })
}
