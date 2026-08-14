---
name: hono-api-design
description: Hono 后端 API 设计规范。涵盖路由组织、RESTful 约定、请求校验、响应格式、分页、过滤、错误处理和版本控制。适用于任何基于 Hono + TypeScript 的后端服务。
---

# Hono API Design

This skill defines standards for designing Hono APIs that are consistent, type-safe, and easy to consume.

## Project Structure

```
backend/
├── src/
│   ├── index.ts
│   ├── routes/
│   │   ├── pages.ts
│   │   ├── components.ts
│   │   ├── datasources.ts
│   │   └── auth.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── cors.ts
│   │   └── error.ts
│   ├── db/
│   │   ├── schema.ts
│   │   └── index.ts
│   └── types/
│       └── index.ts
└── package.json
```

## Route Design

### RESTful Conventions

```typescript
// routes/pages.ts
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db'
import { pages } from '../db/schema'
import { eq } from 'drizzle-orm'
import { success, fail } from '../utils/response'

const app = new Hono()

// List
app.get('/projects/:projectId/pages', async (c) => {
  const projectId = c.req.param('projectId')
  const result = await db.select().from(pages).where(eq(pages.projectId, projectId))
  return success(result)
})

// Create
app.post('/projects/:projectId/pages', async (c) => {
  const body = await c.req.json()
  const parsed = CreatePageSchema.safeParse(body)
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Invalid request', 422, parsed.error.flatten())
  }
  const [page] = await db.insert(pages).values({ id: crypto.randomUUID(), ...parsed.data }).returning()
  return success(page, 201)
})

// Read
app.get('/pages/:id', async (c) => {
  const id = c.req.param('id')
  const [page] = await db.select().from(pages).where(eq(pages.id, id))
  if (!page) return fail('NOT_FOUND', 'Page not found', 404)
  return success(page)
})

// Update
app.patch('/pages/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const [page] = await db.update(pages).set({ ...body, updatedAt: new Date() }).where(eq(pages.id, id)).returning()
  return success(page)
})

// Delete
app.delete('/pages/:id', async (c) => {
  const id = c.req.param('id')
  await db.delete(pages).where(eq(pages.id, id))
  return c.body(null, 204)
})

export default app
```

### Rules

- MUST use nouns for resource paths (`/pages`, not `/getPages`)
- MUST NOT use verbs in route paths
- MUST use plural nouns for collections
- MUST use nested routes for sub-resources (`/projects/:id/pages`)
- MUST use proper HTTP methods (GET, POST, PATCH, DELETE)
- MUST NOT use GET for mutations

## Request Validation

### Zod Schemas at the Edge

```typescript
import { z } from 'zod'

const CreatePageSchema = z.object({
  name: z.string().min(1).max(255),
  projectId: z.string().uuid(),
  schema: z.record(z.any()),
})

// Validate before any business logic
app.post('/projects/:projectId/pages', async (c) => {
  const body = await c.req.json()
  const parsed = CreatePageSchema.safeParse(body)
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Invalid request body', 422, parsed.error.flatten())
  }
  // business logic...
})
```

### Query Parameter Validation

```typescript
const ListPagesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['createdAt', 'updatedAt', 'name']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

app.get('/projects/:projectId/pages', async (c) => {
  const query = ListPagesSchema.parse({
    ...c.req.query(),
    page: Number(c.req.query('page') ?? 1),
    limit: Number(c.req.query('limit') ?? 20),
  })
  // ...
})
```

## Response Format

### Standard Envelope

```typescript
// utils/response.ts
interface ApiResponse<T> {
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, any>
  }
  meta?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

function success<T>(data: T, status = 200): Response {
  return c.json({ data }, status)
}

function fail(
  code: string,
  message: string,
  status = 400,
  details?: Record<string, any>
): Response {
  return c.json({ error: { code, message, ...(details && { details }) } }, status)
}
```

### Pagination

```typescript
app.get('/projects/:projectId/pages', async (c) => {
  const { page, limit, sort, order } = c.get('query')
  const offset = (page - 1) * limit

  const [items, [{ total }]] = await Promise.all([
    db.select().from(pages).where(eq(pages.projectId, projectId)).orderBy(...).limit(limit).offset(offset),
    db.select({ total: count() }).from(pages).where(eq(pages.projectId, projectId)),
  ])

  return success(items, 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  })
})
```

## Middleware Composition

### Route-Level Middleware

```typescript
// routes/pages.ts
const app = new Hono()

// Auth required for all routes in this router
app.use('*', authMiddleware)

// Specific route middleware
app.put('/pages/:id/publish', publishMiddleware)
```

### Cross-Cutting Concerns

```typescript
// middleware/logger.ts
app.use('*', async (c, next) => {
  const start = Date.now()
  await next()
  const duration = Date.now() - start
  console.log(`${c.req.method} ${c.req.path} ${c.res.status} ${duration}ms`)
})
```

## Error Handling

### Centralized Error Handler

```typescript
// middleware/error.ts
import { HTTPException } from 'hono/http-exception'

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: { code: err.message, message: err.message } }, err.status)
  }
  if (err instanceof z.ZodError) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: err.flatten() } }, 422)
  }
  console.error(err)
  return c.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500)
})
```

## Versioning

### URL Versioning (Recommended)

```typescript
// routes/v1/pages.ts
const app = new Hono()
app.get('/pages', listPagesV1)

// routes/v2/pages.ts
const app = new Hono()
app.get('/pages', listPagesV2)

// index.ts
const app = new Hono()
app.route('/v1', v1Routes)
app.route('/v2', v2Routes)
```

## Checklist

When designing an API route:
- [ ] Resource path uses plural noun
- [ ] HTTP method matches operation semantics
- [ ] Request body/query is validated with Zod at the edge
- [ ] Response uses standard envelope (`{ data }` or `{ error }`)
- [ ] Errors return appropriate HTTP status codes
- [ ] Pagination uses `page`, `limit`, `total` consistently
- [ ] Sensitive routes are protected by auth middleware
- [ ] Route versioning strategy is defined
