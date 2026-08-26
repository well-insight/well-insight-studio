import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { z } from 'zod'
import { users } from '../db/schema/users'
import { createTokens, hashPassword, verifyAccessToken, verifyPassword, verifyRefreshToken } from '../services/auth'
import type { AppBindings } from '../types/context'

const registerSchema = z.object({
  email: z.string().email().min(1).max(320),
  password: z.string().min(6).max(128),
  displayName: z.string().min(1).max(120),
})

const loginSchema = z.object({
  email: z.string().min(1).max(320),
  password: z.string().min(1).max(128),
})

const ACCESS_TOKEN_COOKIE = 'well_access_token'
const REFRESH_TOKEN_COOKIE = 'well_refresh_token'

function setAuthCookies(c: any, tokens: { accessToken: string; refreshToken: string }, remember = false) {
  const accessOptions = { httpOnly: true, secure: false, sameSite: 'Lax', path: '/', maxAge: 60 * 60 * 24 * 7 } as const
  const refreshOptions = { httpOnly: true, secure: false, sameSite: 'Lax', path: '/', maxAge: remember ? 60 * 60 * 24 * 30 : undefined } as const
  setCookie(c, ACCESS_TOKEN_COOKIE, tokens.accessToken, accessOptions)
  setCookie(c, REFRESH_TOKEN_COOKIE, tokens.refreshToken, refreshOptions)
}

function clearAuthCookies(c: any) {
  deleteCookie(c, ACCESS_TOKEN_COOKIE, { path: '/' })
  deleteCookie(c, REFRESH_TOKEN_COOKIE, { path: '/' })
}

export function createAuthRoutes() {
  const app = new Hono<AppBindings>()

  app.post('/register', zValidator('json', registerSchema), async (c) => {
    const body = c.req.valid('json')
    const { db } = c.get('db')
    const config = c.get('config')

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, body.email)).limit(1)
    if (existing.length > 0) {
      return c.json({ error: { code: 'EMAIL_EXISTS', message: '该邮箱已被注册' } }, 409)
    }

    const id = crypto.randomUUID()
    const passwordHash = await hashPassword(body.password)
    await db.insert(users).values({
      id,
      email: body.email,
      displayName: body.displayName,
      passwordHash,
    })

    const tokens = createTokens({ userId: id, email: body.email }, config)
    setAuthCookies(c, tokens)

    return c.json({ user: { id, email: body.email, displayName: body.displayName } }, 201)
  })

  app.post('/login', zValidator('json', loginSchema), async (c) => {
    const body = c.req.valid('json')
    const { db } = c.get('db')
    const config = c.get('config')

    const [user] = await db.select({ id: users.id, email: users.email, displayName: users.displayName, passwordHash: users.passwordHash }).from(users).where(eq(users.email, body.email)).limit(1)
    if (!user) {
      return c.json({ error: { code: 'INVALID_CREDENTIALS', message: '邮箱或密码错误' } }, 401)
    }

    const valid = await verifyPassword(body.password, user.passwordHash)
    if (!valid) {
      return c.json({ error: { code: 'INVALID_CREDENTIALS', message: '邮箱或密码错误' } }, 401)
    }

    const tokens = createTokens({ userId: user.id, email: user.email }, config)
    setAuthCookies(c, tokens)

    return c.json({ user: { id: user.id, email: user.email, displayName: user.displayName } })
  })

  app.post('/refresh', async (c) => {
    const refreshToken = getCookie(c, REFRESH_TOKEN_COOKIE)
    if (!refreshToken) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: '未登录' } }, 401)
    }
    const config = c.get('config')
    const { db } = c.get('db')

    try {
      const { sub } = verifyRefreshToken(refreshToken, config)
      const [user] = await db.select({ id: users.id, email: users.email, displayName: users.displayName }).from(users).where(eq(users.id, sub)).limit(1)
      if (!user) return c.json({ error: { code: 'UNAUTHORIZED', message: '用户不存在' } }, 401)

      const tokens = createTokens({ userId: user.id, email: user.email }, config)
      setAuthCookies(c, tokens)
      return c.json({ user: { id: user.id, email: user.email, displayName: user.displayName } })
    } catch {
      clearAuthCookies(c)
      return c.json({ error: { code: 'UNAUTHORIZED', message: '登录已过期' } }, 401)
    }
  })

  app.post('/logout', async (c) => {
    clearAuthCookies(c)
    return c.json({ ok: true })
  })

  app.get('/me', async (c) => {
    const accessToken = getCookie(c, ACCESS_TOKEN_COOKIE)
    if (!accessToken) return c.json({ user: null })
    const config = c.get('config')
    const { db } = c.get('db')
    try {
      const payload = verifyAccessToken(accessToken, config)
      const [user] = await db.select({ id: users.id, email: users.email, displayName: users.displayName }).from(users).where(eq(users.id, payload.userId)).limit(1)
      if (!user) return c.json({ user: null })
      return c.json({ user: { id: user.id, email: user.email, displayName: user.displayName } })
    } catch {
      return c.json({ user: null })
    }
  })

  return app
}
