import { NextRequest } from 'next/server'
import { prisma } from './db'
import { verifyToken, signToken, type TokenPayload } from './token'

export interface AuthUser {
  id: string
  username: string
  slug: string
  role: string
}

export async function getCurrentUser(request: NextRequest): Promise<AuthUser | null> {
  const token = request.cookies.get('admin_token')?.value
  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  const user = await prisma.user.findUnique({ where: { id: payload.id } })
  if (!user) return null

  return {
    id: user.id,
    username: user.username,
    slug: user.slug,
    role: user.role,
  }
}

export function setAuthCookie(response: Response, user: TokenPayload) {
  const token = signToken({ id: user.id, username: user.username })
  ;(response as any).cookies?.set?.('admin_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
  })
}
