import type { AuthContext } from '../middleware/auth'
import { zValidator } from '@hono/zod-validator'
import { and, asc, eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { datasetFields, datasetFolders, datasetRows, datasets } from '../db/schema'
import { projects } from '../db/schema/projects'
import { requireAuth } from '../middleware/auth'

const fieldSchema = z.object({ name: z.string().min(1).max(200), fieldType: z.enum(['text', 'number', 'datetime']), sortOrder: z.number().int().optional() })
const datasetSchema = z.object({ name: z.string().min(1).max(255), description: z.string().max(5000).nullable().optional(), folderId: z.string().nullable().optional(), fields: z.array(fieldSchema).min(1) })
const rowValuesSchema = z.record(z.string(), z.union([z.string(), z.number(), z.null()]))
const rowSchema = z.object({ values: rowValuesSchema, sortOrder: z.number().int().optional() })
const folderSchema = z.object({ name: z.string().min(1).max(255), description: z.string().max(2000).nullable().optional(), projectId: z.string().nullable().optional(), parentId: z.string().nullable().optional() })
const folderUpdateSchema = z.object({ name: z.string().min(1).max(255).optional(), description: z.string().max(2000).nullable().optional(), parentId: z.string().nullable().optional() })

export function createDatasetsRoutes() {
  const app = new Hono<AuthContext>()
  app.use('*', requireAuth)

  async function ownsProject(c: any, projectId: string | null) {
    if (!projectId) return true
    const [project] = await c.get('db').db.select({ id: projects.id }).from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, c.get('user').userId))).limit(1)
    return Boolean(project)
  }

  app.get('/', async (c) => {
    const projectId = c.req.query('projectId')
    if (!(await ownsProject(c, projectId ?? null))) return c.json({ error: { code: 'FORBIDDEN', message: '无权访问此项目' } }, 403)
    const { db } = c.get('db')
    const rows = await db.select().from(datasets).where(projectId ? eq(datasets.projectId, projectId) : sql`1=1`).orderBy(asc(datasets.name))
    const result = await Promise.all(rows.map(async dataset => {
      const fields = await db.select().from(datasetFields).where(eq(datasetFields.datasetId, dataset.id)).orderBy(asc(datasetFields.sortOrder))
      const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(datasetRows).where(eq(datasetRows.datasetId, dataset.id))
      return { ...dataset, fields, rowCount: Number(countRow?.count ?? 0) }
    }))
    return c.json({ datasets: result })
  })

  app.get('/folders', async (c) => {
    const projectId = c.req.query('projectId')
    if (!(await ownsProject(c, projectId ?? null))) return c.json({ error: { code: 'FORBIDDEN', message: '无权访问此项目' } }, 403)
    const rows = await c.get('db').db.select().from(datasetFolders).where(projectId ? eq(datasetFolders.projectId, projectId) : sql`1=1`).orderBy(asc(datasetFolders.name))
    return c.json({ folders: rows })
  })

  app.put('/folders/:id', zValidator('json', folderUpdateSchema), async (c) => {
    const id = c.req.param('id'); const body = c.req.valid('json'); const { db } = c.get('db')
    const [folder] = await db.select().from(datasetFolders).where(eq(datasetFolders.id, id)).limit(1)
    if (!folder) return c.json({ error: { code: 'NOT_FOUND', message: '目录不存在' } }, 404)
    if (!(await ownsProject(c, folder.projectId))) return c.json({ error: { code: 'FORBIDDEN', message: '无权编辑此目录' } }, 403)
    if (body.parentId === id) return c.json({ error: { code: 'INVALID_PARENT', message: '目录不能移动到自身' } }, 400)
    await db.update(datasetFolders).set(body).where(eq(datasetFolders.id, id))
    const [updated] = await db.select().from(datasetFolders).where(eq(datasetFolders.id, id)).limit(1)
    return c.json(updated)
  })

  app.delete('/folders/:id', async (c) => {
    const id = c.req.param('id'); const { db } = c.get('db')
    const [folder] = await db.select().from(datasetFolders).where(eq(datasetFolders.id, id)).limit(1)
    if (!folder) return c.json({ error: { code: 'NOT_FOUND', message: '目录不存在' } }, 404)
    if (!(await ownsProject(c, folder.projectId))) return c.json({ error: { code: 'FORBIDDEN', message: '无权删除此目录' } }, 403)
    const [child] = await db.select({ id: datasetFolders.id }).from(datasetFolders).where(eq(datasetFolders.parentId, id)).limit(1)
    const [dataset] = await db.select({ id: datasets.id }).from(datasets).where(eq(datasets.folderId, id)).limit(1)
    if (child || dataset) return c.json({ error: { code: 'FOLDER_NOT_EMPTY', message: '目录非空，请先移走其中的内容' } }, 409)
    await db.delete(datasetFolders).where(eq(datasetFolders.id, id))
    return c.body(null, 204)
  })

  app.get('/:id', async (c) => {
    const id = c.req.param('id'); const { db } = c.get('db')
    const [dataset] = await db.select().from(datasets).where(eq(datasets.id, id)).limit(1)
    if (!dataset) return c.json({ error: { code: 'NOT_FOUND', message: 'dataset not found' } }, 404)
    if (!(await ownsProject(c, dataset.projectId))) return c.json({ error: { code: 'FORBIDDEN', message: '无权访问此数据集' } }, 403)
    const fields = await db.select().from(datasetFields).where(eq(datasetFields.datasetId, id)).orderBy(asc(datasetFields.sortOrder))
    return c.json({ dataset: { ...dataset, fields } })
  })

  app.post('/', zValidator('json', datasetSchema), async (c) => {
    const body = c.req.valid('json'); const id = crypto.randomUUID(); const { db } = c.get('db')
    await db.insert(datasets).values({ id, name: body.name, description: body.description ?? null, projectId: null, folderId: body.folderId ?? null })
    await db.insert(datasetFields).values(body.fields.map((field, index) => ({ id: crypto.randomUUID(), datasetId: id, name: field.name, fieldType: field.fieldType, sortOrder: field.sortOrder ?? index })))
    const [dataset] = await db.select().from(datasets).where(eq(datasets.id, id)).limit(1)
    return c.json({ dataset }, 201)
  })

  app.post('/folders', zValidator('json', folderSchema.omit({ projectId: true })), async (c) => {
    const body = c.req.valid('json'); const id = crypto.randomUUID(); await c.get('db').db.insert(datasetFolders).values({ id, name: body.name, description: body.description ?? null, projectId: null, parentId: body.parentId ?? null })
    return c.json({ id, ...body, projectId: null }, 201)
  })

  app.get('/:id/rows', async (c) => {
    const page = Math.max(1, Number(c.req.query('page') ?? 1)); const pageSize = Math.min(100, Math.max(1, Number(c.req.query('pageSize') ?? 20))); const { db } = c.get('db'); const id = c.req.param('id')
    const [dataset] = await db.select({ projectId: datasets.projectId }).from(datasets).where(eq(datasets.id, id)).limit(1)
    if (!dataset) return c.json({ error: { code: 'NOT_FOUND', message: 'dataset not found' } }, 404)
    if (!(await ownsProject(c, dataset.projectId))) return c.json({ error: { code: 'FORBIDDEN', message: '无权访问此数据集' } }, 403)
    const rows = await db.select().from(datasetRows).where(eq(datasetRows.datasetId, id)).orderBy(asc(datasetRows.sortOrder)).limit(pageSize).offset((page - 1) * pageSize)
    const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(datasetRows).where(eq(datasetRows.datasetId, id))
    return c.json({ rows, total: Number(countRow?.count ?? 0), page, pageSize })
  })

  app.post('/:id/rows', zValidator('json', rowSchema), async (c) => {
    const body = c.req.valid('json'); const datasetId = c.req.param('id'); const [dataset] = await c.get('db').db.select({ projectId: datasets.projectId }).from(datasets).where(eq(datasets.id, datasetId)).limit(1)
    if (!dataset) return c.json({ error: { code: 'NOT_FOUND', message: 'dataset not found' } }, 404)
    if (!(await ownsProject(c, dataset.projectId))) return c.json({ error: { code: 'FORBIDDEN', message: '无权写入此数据集' } }, 403)
    const id = crypto.randomUUID(); await c.get('db').db.insert(datasetRows).values({ id, datasetId, values: body.values as Record<string, string | number | null>, sortOrder: body.sortOrder ?? 0 }); return c.json({ id, datasetId, ...body }, 201)
  })

  app.post('/:id/rows/batch', zValidator('json', z.object({ rows: z.array(rowValuesSchema).min(1).max(1000) })), async (c) => {
    const body = c.req.valid('json'); const datasetId = c.req.param('id'); const [dataset] = await c.get('db').db.select({ projectId: datasets.projectId }).from(datasets).where(eq(datasets.id, datasetId)).limit(1)
    if (!dataset) return c.json({ error: { code: 'NOT_FOUND', message: 'dataset not found' } }, 404)
    if (!(await ownsProject(c, dataset.projectId))) return c.json({ error: { code: 'FORBIDDEN', message: '无权写入此数据集' } }, 403)
    await c.get('db').db.insert(datasetRows).values(body.rows.map((values, index) => ({ id: crypto.randomUUID(), datasetId, values: values as Record<string, string | number | null>, sortOrder: index }))); return c.json({ count: body.rows.length }, 201)
  })

  app.delete('/:id', async (c) => { const { db } = c.get('db'); const id = c.req.param('id'); const [dataset] = await db.select({ projectId: datasets.projectId }).from(datasets).where(eq(datasets.id, id)).limit(1); if (!dataset) return c.json({ error: { code: 'NOT_FOUND', message: 'dataset not found' } }, 404); if (!(await ownsProject(c, dataset.projectId))) return c.json({ error: { code: 'FORBIDDEN', message: '无权删除此数据集' } }, 403); await db.delete(datasetRows).where(eq(datasetRows.datasetId, id)); await db.delete(datasetFields).where(eq(datasetFields.datasetId, id)); await db.delete(datasets).where(eq(datasets.id, id)); return c.body(null, 204) })
  return app
}
