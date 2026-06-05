import { createHmac } from 'crypto'

const SECRET = process.env.NEXTAUTH_SECRET || 'default-fallback-secret-change-in-production'

export interface TokenPayload {
  id: string
  username: string
}

/** 签发带签名的认证 token */
export function signToken(payload: TokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', SECRET).update(body).digest('base64url')
  return `${body}.${sig}`
}

/** 验证 token 签名并返回 payload，验证失败返回 null */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 2) return null
    const [body, sig] = parts
    const expectedSig = createHmac('sha256', SECRET).update(body).digest('base64url')
    if (sig !== expectedSig) return null
    return JSON.parse(Buffer.from(body, 'base64url').toString())
  } catch {
    return null
  }
}
