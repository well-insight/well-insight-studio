import type { AppBindings } from '../types/context'
import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { z } from 'zod'
import { users } from '../db/schema/users'
import { createTokens, hashPassword, verifyAccessToken, verifyPassword, verifyRefreshToken } from '../services/auth'

const emailSchema = z.string().trim().toLowerCase().email().max(320)

const usernameSchema = z.string().trim().min(3).max(64).regex(/^[\w-]+$/, '账户名称只能包含字母、数字、下划线和短横线')

const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: z.string().min(6).max(128),
  displayName: z.string().trim().max(120).optional().default(''),
})

const loginSchema = z.object({
  identifier: z.string().trim().min(1).max(320),
  password: z.string().min(1).max(128),
})

const ACCESS_TOKEN_COOKIE = 'well_access_token'
const REFRESH_TOKEN_COOKIE = 'well_refresh_token'

function setAuthCookies(c: any, tokens: { accessToken: string; refreshToken: string }, secure: boolean, remember = false) {
  const accessOptions = { httpOnly: true, secure, sameSite: 'Lax', path: '/', maxAge: 60 * 60 * 24 * 7 } as const
  const refreshOptions = { httpOnly: true, secure, sameSite: 'Lax', path: '/', maxAge: remember ? 60 * 60 * 24 * 30 : undefined } as const
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

    const normalizedUsername = body.username.toLowerCase()
    const existingEmail = await db.select({ id: users.id }).from(users).where(eq(users.email, body.email)).limit(1)
    if (existingEmail.length > 0) {
      return c.json({ error: { code: 'EMAIL_EXISTS', message: '该邮箱已被注册' } }, 409)
    }
    const existingUsername = await db.select({ id: users.id }).from(users).where(eq(users.username, normalizedUsername)).limit(1)
    if (existingUsername.length > 0) {
      return c.json({ error: { code: 'USERNAME_EXISTS', message: '该账户名称已被使用' } }, 409)
    }

    const id = crypto.randomUUID()
    const passwordHash = await hashPassword(body.password)
    await db.insert(users).values({
      id,
      username: normalizedUsername,
      email: body.email,
      displayName: body.displayName || normalizedUsername,
      passwordHash,
    })

    const tokens = createTokens({ userId: id, email: body.email }, config)
    setAuthCookies(c, tokens, config.NODE_ENV === 'production')

    return c.json({ user: { id, username: normalizedUsername, email: body.email, displayName: body.displayName || normalizedUsername } }, 201)
  })

  app.post('/login', zValidator('json', loginSchema), async (c) => {
    const body = c.req.valid('json')
    const { db } = c.get('db')
    const config = c.get('config')

    const identifier = body.identifier.toLowerCase()
    const [user] = await db.select({ id: users.id, username: users.username, email: users.email, displayName: users.displayName, passwordHash: users.passwordHash }).from(users).where(eq(users.email, identifier)).limit(1)
    const [usernameUser] = user
      ? [undefined]
      : await db.select({ id: users.id, username: users.username, email: users.email, displayName: users.displayName, passwordHash: users.passwordHash }).from(users).where(eq(users.username, identifier)).limit(1)
    const matchedUser = user ?? usernameUser
    if (!matchedUser) {
      return c.json({ error: { code: 'INVALID_CREDENTIALS', message: '账户名称/邮箱或密码错误' } }, 401)
    }

    const valid = await verifyPassword(body.password, matchedUser.passwordHash)
    if (!valid) {
      return c.json({ error: { code: 'INVALID_CREDENTIALS', message: '账户名称/邮箱或密码错误' } }, 401)
    }

    const tokens = createTokens({ userId: matchedUser.id, email: matchedUser.email }, config)
    setAuthCookies(c, tokens, config.NODE_ENV === 'production')

    return c.json({ user: { id: matchedUser.id, username: matchedUser.username, email: matchedUser.email, displayName: matchedUser.displayName } })
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
      const [user] = await db.select({ id: users.id, username: users.username, email: users.email, displayName: users.displayName }).from(users).where(eq(users.id, sub)).limit(1)
      if (!user) return c.json({ error: { code: 'UNAUTHORIZED', message: '用户不存在' } }, 401)

      const tokens = createTokens({ userId: user.id, email: user.email }, config)
      setAuthCookies(c, tokens, config.NODE_ENV === 'production')
      return c.json({ user: { id: user.id, username: user.username, email: user.email, displayName: user.displayName } })
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
      const [user] = await db.select({ id: users.id, username: users.username, email: users.email, displayName: users.displayName }).from(users).where(eq(users.id, payload.userId)).limit(1)
      if (!user) return c.json({ user: null })
      return c.json({ user: { id: user.id, username: user.username, email: user.email, displayName: user.displayName } })
    } catch {
      return c.json({ user: null })
    }
  })

  return app
}
