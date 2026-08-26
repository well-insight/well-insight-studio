import { getCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import { verifyAccessToken } from '../services/auth'
import type { AppBindings } from '../types/context'

const ACCESS_TOKEN_COOKIE = 'well_access_token'

export interface AuthContext extends AppBindings {
  Variables: AppBindings['Variables'] & {
    user: { userId: string; email: string }
  }
}

export const requireAuth = createMiddleware<AuthContext>(async (c, next) => {
  const accessToken = getCookie(c, ACCESS_TOKEN_COOKIE)
  if (!accessToken) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: '请先登录' } }, 401)
  }
  const config = c.get('config')
  try {
    const payload = verifyAccessToken(accessToken, config)
    c.set('user', payload)
    await next()
  } catch {
    return c.json({ error: { code: 'UNAUTHORIZED', message: '登录已过期，请重新登录' } }, 401)
  }
})

export const optionalAuth = createMiddleware<AuthContext>(async (c, next) => {
  const accessToken = getCookie(c, ACCESS_TOKEN_COOKIE)
  const config = c.get('config')
  if (accessToken) {
    try {
      const payload = verifyAccessToken(accessToken, config)
      c.set('user', payload)
    } catch {
      // ignore invalid token
    }
  }
  await next()
})
