import { zValidator } from '@hono/zod-validator'
import type { ProjectConfig } from '@well-insight/shared'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { projects } from '../db/schema/projects'
import { datasourceConnections } from '../db/schema/datasourceConnections'
import type { AppBindings } from '../types/context'
import type { AuthContext } from '../middleware/auth'
import { requireAuth } from '../middleware/auth'

const projectConfigSchema: z.ZodType<ProjectConfig> = z.object({
  version: z.literal(1),
  widgets: z.array(z.any()),
  canvas: z.object({ zoom: z.number() }),
}) as z.ZodType<ProjectConfig>

const createSchema = z.object({
  name: z.string().min(1).max(255),
  config: projectConfigSchema.optional(),
})

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  config: projectConfigSchema.optional(),
})

export function createProjectsRoutes() {
  const app = new Hono<AuthContext>()

  app.use('*', requireAuth)

  app.get('/', async (c) => {
    const { db } = c.get('db')
    const user = c.get('user')
    const rows = await db
      .select({ id: projects.id, name: projects.name, updatedAt: projects.updatedAt })
      .from(projects)
      .where(eq(projects.userId, user.userId))
    return c.json({ projects: rows })
  })

  app.get('/:id/datasources', async (c) => {
    const id = c.req.param('id')
    const { db } = c.get('db')
    const user = c.get('user')
    const [project] = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.id, id), eq(projects.userId, user.userId))).limit(1)
    if (!project) return c.json({ error: { code: 'NOT_FOUND', message: 'project not found' } }, 404)

    const rows = await db
      .select({ id: datasourceConnections.id, name: datasourceConnections.name, type: datasourceConnections.type, updatedAt: datasourceConnections.updatedAt })
      .from(datasourceConnections)
      .where(eq(datasourceConnections.projectId, id))
    return c.json({ datasources: rows })
  })

  app.post('/', zValidator('json', createSchema), async (c) => {
    const body = c.req.valid('json')
    const id = crypto.randomUUID()
    const config = body.config ?? {
      version: 1,
      widgets: [],
      canvas: { zoom: 1 },
    } as ProjectConfig
    const { db } = c.get('db')
    const user = c.get('user')
    await db.insert(projects).values({
      id,
      userId: user.userId,
      name: body.name,
      config,
    })
    // 每个项目自动创建一个内置样例数据源
    await db.insert(datasourceConnections).values({
      id: crypto.randomUUID(),
      projectId: id,
      name: '样例数据',
      type: 'mysql',
      schemaCache: {
        orders: {
          fields: [
            { name: 'order_id', type: 'number' },
            { name: 'customer_id', type: 'number' },
            { name: 'product', type: 'string' },
            { name: 'category', type: 'string' },
            { name: 'amount', type: 'number' },
            { name: 'order_date', type: 'string' },
            { name: 'status', type: 'string' },
          ],
        },
        customers: {
          fields: [
            { name: 'customer_id', type: 'number' },
            { name: 'name', type: 'string' },
            { name: 'age', type: 'number' },
            { name: 'city', type: 'string' },
            { name: 'signup_date', type: 'string' },
          ],
        },
        products: {
          fields: [
            { name: 'product_id', type: 'number' },
            { name: 'product_name', type: 'string' },
            { name: 'category', type: 'string' },
            { name: 'price', type: 'number' },
            { name: 'stock', type: 'number' },
          ],
        },
      },
    })
    return c.json({ id, name: body.name, config }, 201)
  })

  app.get('/:id', async (c) => {
    const id = c.req.param('id')
    const user = c.get('user')
    const [row] = await c.get('db').db.select().from(projects).where(and(eq(projects.id, id), eq(projects.userId, user.userId))).limit(1)
    if (!row) return c.json({ error: { code: 'NOT_FOUND', message: 'project not found' } }, 404)
    return c.json({ id: row.id, name: row.name, config: row.config, updatedAt: row.updatedAt })
  })

  app.put('/:id', zValidator('json', updateSchema), async (c) => {
    const id = c.req.param('id')
    const body = c.req.valid('json')
    const { db } = c.get('db')
    const user = c.get('user')

    const [existing] = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.id, id), eq(projects.userId, user.userId))).limit(1)
    if (!existing) return c.json({ error: { code: 'NOT_FOUND', message: 'project not found' } }, 404)

    const patch: Partial<typeof projects.$inferInsert> = {}
    if (body.name !== undefined) patch.name = body.name
    if (body.config !== undefined) patch.config = body.config

    if (Object.keys(patch).length === 0) {
      return c.json({ error: { code: 'BAD_REQUEST', message: 'no fields to update' } }, 400)
    }

    await db.update(projects).set(patch).where(eq(projects.id, id))
    const [row] = await db.select().from(projects).where(eq(projects.id, id)).limit(1)
    return c.json({ id: row!.id, name: row!.name, config: row!.config, updatedAt: row!.updatedAt })
  })

  app.delete('/:id', async (c) => {
    const id = c.req.param('id')
    const { db } = c.get('db')
    const user = c.get('user')
    const [existing] = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.id, id), eq(projects.userId, user.userId))).limit(1)
    if (!existing) return c.json({ error: { code: 'NOT_FOUND', message: 'project not found' } }, 404)
    await db.delete(projects).where(eq(projects.id, id))
    return c.body(null, 204)
  })

  return app
}
