---
name: hono-auth-middleware
description: Hono 认证与授权中间件设计。涵盖 JWT 认证、Session 管理、角色权限、资源所有权校验和令牌刷新。适用于任何基于 Hono + TypeScript 的后端服务。
---

# Hono Auth Middleware

This skill guides the implementation of authentication and authorization middleware in Hono.

## JWT Authentication

### Token Verification Middleware

```typescript
// middleware/auth.ts
import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import { HTTPException } from 'hono/http-exception'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

type Bindings = {
  JWT_SECRET: string
  JWT_EXPIRES: string
}

type Variables = {
  userId: string
  userRole: string
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

app.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Missing authorization token' })
  }

  const token = authHeader.slice(7)

  try {
    const payload = await c.jwt.verify<{ sub: string; role: string }>(token)
    const [user] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, payload.sub))
    if (!user) {
      throw new HTTPException(401, { message: 'User not found' })
    }
    c.set('userId', user.id)
    c.set('userRole', user.role)
    await next()
  } catch {
    throw new HTTPException(401, { message: 'Invalid or expired token' })
  }
})

export const authMiddleware = app
```

### Route Protection

```typescript
// routes/pages.ts
import { authMiddleware } from '../middleware/auth'

const app = new Hono()
app.use('*', authMiddleware)

app.get('/pages', (c) => {
  const userId = c.get('userId')
  // ...
})
```

## Role-Based Access Control

### Permission Middleware

```typescript
// middleware/rbac.ts
type Role = 'admin' | 'editor' | 'viewer'
type Permission = 'pages:read' | 'pages:write' | 'pages:delete' | 'users:manage'

const rolePermissions: Record<Role, Permission[]> = {
  admin: ['pages:read', 'pages:write', 'pages:delete', 'users:manage'],
  editor: ['pages:read', 'pages:write'],
  viewer: ['pages:read'],
}

function requirePermission(permission: Permission) {
  return async (c: Context<{ Variables: Variables }>, next: () => Promise<void>) => {
    const userRole = c.get('userRole') as Role
    const permissions = rolePermissions[userRole] ?? []
    if (!permissions.includes(permission)) {
      throw new HTTPException(403, { message: 'Forbidden' })
    }
    await next()
  }
}

// Usage
app.get('/pages/:id', requirePermission('pages:read'), getPage)
app.patch('/pages/:id', requirePermission('pages:write'), updatePage)
app.delete('/pages/:id', requirePermission('pages:delete'), deletePage)
```

## Resource Ownership

Verify the current user owns the requested resource.

```typescript
// middleware/ownership.ts
async function requireOwnership(
  c: Context<{ Variables: Variables }>,
  next: () => Promise<void>,
  params: { projectId: string }
) {
  const userId = c.get('userId')
  const [project] = await db.select().from(projects).where(eq(projects.id, params.projectId))
  if (!project || project.userId !== userId) {
    throw new HTTPException(403, { message: 'Forbidden' })
  }
  await next()
}

// Usage
app.get('/projects/:projectId/pages', requireOwnership, listPages)
```

## Token Refresh

```typescript
// routes/auth.ts
import { sign } from 'hono/jwt'

const app = new Hono()

app.post('/auth/refresh', async (c) => {
  const refreshToken = c.req.header('X-Refresh-Token')
  if (!refreshToken) {
    return c.json({ error: 'Missing refresh token' }, 401)
  }

  try {
    const payload = await c.jwt.verify<{ sub: string; type: 'refresh' }>(refreshToken)
    const [user] = await db.select().from(users).where(eq(users.id, payload.sub))
    if (!user) {
      return c.json({ error: 'Invalid refresh token' }, 401)
    }

    const accessToken = await sign(
      { sub: user.id, role: user.role },
      c.env.JWT_SECRET,
      c.env.JWT_EXPIRES
    )

    return c.json({ accessToken })
  } catch {
    return c.json({ error: 'Invalid refresh token' }, 401)
  }
})
```

## Session-Based Authentication

```typescript
// middleware/session.ts
import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'

export const sessionMiddleware = createMiddleware(async (c, next) => {
  const sessionId = getCookie(c, 'sessionId')
  if (!sessionId) {
    return next()
  }

  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId))
  if (!session || session.expiresAt < new Date()) {
    return next()
  }

  c.set('userId', session.userId)
  await next()
})
```

## API Key Authentication

```typescript
// middleware/api-key.ts
export const apiKeyMiddleware = createMiddleware(async (c, next) => {
  const apiKey = c.req.header('X-API-Key')
  if (!apiKey) {
    return c.json({ error: 'Missing API key' }, 401)
  }

  const [key] = await db.select().from(apiKeys).where(eq(apiKeys.key, apiKey))
  if (!key || key.revokedAt) {
    return c.json({ error: 'Invalid API key' }, 403)
  }

  c.set('projectId', key.projectId)
  await next()
})
```

## Logout

```typescript
app.post('/auth/logout', authMiddleware, async (c) => {
  const token = c.req.header('Authorization')?.slice(7)
  // Optionally blacklist the token in Redis
  await redis.del(`token:${token}`)
  return c.json({ success: true })
})
```

## Checklist

When implementing auth:
- [ ] JWT secret comes from environment, not hardcoded
- [ ] Token payload contains only non-sensitive claims
- [ ] Refresh tokens rotate on use
- [ ] Protected routes use middleware, not inline checks
- [ ] Ownership is verified for multi-tenant resources
- [ ] API keys are hashed before storage
- [ ] Logout invalidates the session/token
- [ ] Errors do not leak implementation details
