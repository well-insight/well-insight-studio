import type { DatasourceSchema, QueryRequest, QueryResponse } from '@well-insight/shared'
import type { Context } from 'hono'
import type { AuthContext } from '../middleware/auth'
import { createHash } from 'node:crypto'
import { zValidator } from '@hono/zod-validator'
import { and, eq, gte } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { datasourceConnections } from '../db/schema/datasourceConnections'

import { projects } from '../db/schema/projects'
import { queryCache } from '../db/schema/queryCache'
import { requireAuth } from '../middleware/auth'
import { executeCSVQuery, executeExternalQuery, introspectSchema, testConnection } from '../services/datasource-runner'
import { decryptConnectionString, encryptConnectionString } from '../services/encryption'

const CACHE_TTL_MS = 60 * 1000

const fieldOperationSchema = z.object({
  alias: z.string(),
  agg: z.enum(['none', 'sum', 'avg', 'count', 'min', 'max']),
  sort: z.enum(['none', 'asc', 'desc']),
  filter: z.string(),
  hidden: z.boolean(),
})

const querySchema = z.object({
  table: z.string().min(1),
  fieldOps: z.record(z.string(), fieldOperationSchema),
}).transform(v => v as QueryRequest)

const createDatasourceSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1).max(255),
  type: z.enum(['mysql', 'postgres', 'csv']).default('mysql'),
  connectionString: z.string().max(2048).optional(),
})

const updateDatasourceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  connectionString: z.string().max(2048).optional(),
})

/** 从 schema_cache 推断字段类型（按首行采样） */
function inferFieldTypes(tables: DatasourceSchema['tables'], tableName: string): Record<string, 'number' | 'string'> {
  const table = tables[tableName]
  if (!table) return {}
  return Object.fromEntries(table.fields.map(f => [f.name, f.type]))
}

async function assertDatasourceOwner(c: Context<AuthContext>, datasourceId: string) {
  const { db } = c.get('db')
  const user = c.get('user')
  const [conn] = await db
    .select({ projectId: datasourceConnections.projectId, userId: projects.userId })
    .from(datasourceConnections)
    .leftJoin(projects, eq(datasourceConnections.projectId, projects.id))
    .where(eq(datasourceConnections.id, datasourceId))
    .limit(1)
  if (!conn || conn.userId !== user.userId) {
    throw new Error('FORBIDDEN')
  }
}

export function createDatasourcesRoutes() {
  const app = new Hono<AuthContext>()

  app.use('*', requireAuth)

  app.get('/:id/schema', async (c) => {
    const id = c.req.param('id')
    const { db } = c.get('db')
    const config = c.get('config')

    try {
      await assertDatasourceOwner(c, id)
    } catch {
      return c.json({ error: { code: 'FORBIDDEN', message: '无权访问该数据源' } }, 403)
    }

    const [conn] = await db.select({ schemaCache: datasourceConnections.schemaCache, connectionString: datasourceConnections.connectionString, type: datasourceConnections.type }).from(datasourceConnections).where(eq(datasourceConnections.id, id)).limit(1)
    if (!conn) return c.json({ error: { code: 'NOT_FOUND', message: 'datasource not found' } }, 404)

    const connectionString = decryptConnectionString(conn.connectionString, config)

    // 如果配置了外部连接串，自动同步 schema
    if (connectionString) {
      try {
        const freshSchema = await introspectSchema(conn.type as 'mysql' | 'postgres', connectionString)
        await db.update(datasourceConnections).set({ schemaCache: freshSchema, lastSyncAt: new Date() }).where(eq(datasourceConnections.id, id))
        return c.json({ tables: freshSchema } as DatasourceSchema)
      } catch (err) {
        return c.json({ error: { code: 'SCHEMA_SYNC_FAILED', message: err instanceof Error ? err.message : String(err) } }, 502)
      }
    }

    // 没有连接串时不返回历史样例 schema，工作台只展示真实数据源结构。
    return c.json({ tables: connectionString ? conn.schemaCache : {} } as DatasourceSchema)
  })

  app.post('/:id/test', async (c) => {
    const id = c.req.param('id')
    const { db } = c.get('db')
    const config = c.get('config')

    try {
      await assertDatasourceOwner(c, id)
    } catch {
      return c.json({ error: { code: 'FORBIDDEN', message: '无权访问该数据源' } }, 403)
    }

    const [conn] = await db
      .select({ type: datasourceConnections.type, connectionString: datasourceConnections.connectionString })
      .from(datasourceConnections)
      .where(eq(datasourceConnections.id, id))
      .limit(1)
    if (!conn) return c.json({ error: { code: 'NOT_FOUND', message: 'datasource not found' } }, 404)

    const connectionString = decryptConnectionString(conn.connectionString, config)
    if (!connectionString) {
      return c.json({ ok: false, message: '未配置连接串' })
    }

    const result = await testConnection(conn.type as 'mysql' | 'postgres', connectionString)
    return c.json(result)
  })

  app.post('/:id/query', zValidator('json', querySchema), async (c) => {
    const id = c.req.param('id')
    const body = c.req.valid('json') as QueryRequest
    const { db } = c.get('db')
    const config = c.get('config')

    try {
      await assertDatasourceOwner(c, id)
    } catch {
      return c.json({ error: { code: 'FORBIDDEN', message: '无权访问该数据源' } }, 403)
    }

    const [conn] = await db
      .select({ schemaCache: datasourceConnections.schemaCache, connectionString: datasourceConnections.connectionString, type: datasourceConnections.type, projectId: datasourceConnections.projectId, name: datasourceConnections.name })
      .from(datasourceConnections)
      .where(eq(datasourceConnections.id, id))
      .limit(1)
    if (!conn) return c.json({ error: { code: 'NOT_FOUND', message: 'datasource not found' } }, 404)

    const connectionString = decryptConnectionString(conn.connectionString, config)

    const schemaCache = (conn.schemaCache ?? {}) as DatasourceSchema['tables']
    const fieldTypes = inferFieldTypes(schemaCache, body.table)
    const queryHash = createHash('sha256').update(JSON.stringify({ id, table: body.table, fieldOps: body.fieldOps })).digest('hex')
    const now = new Date()

    const [cached] = await db
      .select({ resultData: queryCache.resultData })
      .from(queryCache)
      .where(and(eq(queryCache.datasourceId, id), eq(queryCache.queryHash, queryHash), gte(queryCache.expiresAt, now)))
      .limit(1)
    if (cached) return c.json(cached.resultData as QueryResponse)

    // 配置了外部连接串：走真实数据库查询
    if (connectionString && conn.type !== 'csv') {
      try {
        const result = await executeExternalQuery(conn.type as 'mysql' | 'postgres', connectionString, body, fieldTypes)
        await db.insert(queryCache).values({
          id: crypto.randomUUID(),
          datasourceId: id,
          queryHash,
          resultData: result,
          expiresAt: new Date(Date.now() + CACHE_TTL_MS),
        })
        return c.json(result)
      } catch (err) {
        return c.json({ error: { code: 'QUERY_FAILED', message: err instanceof Error ? err.message : String(err) } }, 502)
      }
    }

    // CSV 类型：连接串字段复用存储 CSV 内容
    if (conn.type === 'csv') {
      if (!connectionString) {
        return c.json({ error: { code: 'NO_DATA', message: 'CSV 数据源未上传内容' } }, 400)
      }
      try {
        const result = executeCSVQuery(connectionString, body)
        await db.insert(queryCache).values({
          id: crypto.randomUUID(),
          datasourceId: id,
          queryHash,
          resultData: result,
          expiresAt: new Date(Date.now() + CACHE_TTL_MS),
        })
        return c.json(result)
      } catch (err) {
        return c.json({ error: { code: 'CSV_QUERY_FAILED', message: err instanceof Error ? err.message : String(err) } }, 502)
      }
    }

    // 没有连接串时不能返回内置样例，避免工作台误显示虚构数据。
    if (!connectionString) {
      return c.json({ error: { code: 'NO_CONNECTION', message: '数据源未配置连接信息，请先配置真实数据库连接串' } }, 400)
    }

    return c.json({ error: { code: 'NO_CONNECTION', message: '数据源未配置真实连接信息' } }, 400)
  })

  app.post('/', zValidator('json', createDatasourceSchema), async (c) => {
    const body = c.req.valid('json')
    const { db } = c.get('db')
    const config = c.get('config')
    const user = c.get('user')
    const id = crypto.randomUUID()

    const [project] = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.id, body.projectId), eq(projects.userId, user.userId))).limit(1)
    if (!project) return c.json({ error: { code: 'FORBIDDEN', message: '无权在此项目创建数据源' } }, 403)

    const plainConnectionString = body.connectionString?.trim() || null
    const connectionString = plainConnectionString ? encryptConnectionString(plainConnectionString, config) : null

    let schemaCache: DatasourceSchema['tables'] = {}
    if (plainConnectionString && body.type !== 'csv') {
      try {
        schemaCache = await introspectSchema(body.type, plainConnectionString)
      } catch (err) {
        return c.json({ error: { code: 'SCHEMA_SYNC_FAILED', message: err instanceof Error ? err.message : String(err) } }, 502)
      }
    }

    if (body.type === 'csv' && plainConnectionString) {
      // CSV 类型把内容作为 schemaCache 的占位表（第一行为字段）
      try {
        const parsed = plainConnectionString.trim().split('\n').filter(l => l.trim())
        if (parsed.length > 0) {
          const headers = parsed[0]!.split(',').map(h => h.trim())
          schemaCache = {
            data: { fields: headers.map(name => ({ name, type: 'string' as const })) },
          }
        }
      } catch {
        return c.json({ error: { code: 'CSV_PARSE_FAILED', message: 'CSV 内容解析失败' } }, 400)
      }
    }

    await db.insert(datasourceConnections).values({
      id,
      projectId: body.projectId,
      name: body.name,
      type: body.type,
      connectionString,
      schemaCache,
      lastSyncAt: new Date(),
    })

    const [row] = await db.select().from(datasourceConnections).where(eq(datasourceConnections.id, id)).limit(1)
    return c.json({ id: row!.id, projectId: row!.projectId, name: row!.name, type: row!.type, connectionString: null, hasConnection: Boolean(row!.connectionString), schemaCache: row!.schemaCache }, 201)
  })

  app.put('/:id', zValidator('json', updateDatasourceSchema), async (c) => {
    const id = c.req.param('id')
    const body = c.req.valid('json')
    const { db } = c.get('db')
    const config = c.get('config')

    try {
      await assertDatasourceOwner(c, id)
    } catch {
      return c.json({ error: { code: 'FORBIDDEN', message: '无权访问该数据源' } }, 403)
    }

    const [existing] = await db.select().from(datasourceConnections).where(eq(datasourceConnections.id, id)).limit(1)
    if (!existing) return c.json({ error: { code: 'NOT_FOUND', message: 'datasource not found' } }, 404)

    const patch: Partial<typeof datasourceConnections.$inferInsert> = {}
    if (body.name !== undefined) patch.name = body.name
    if (body.connectionString !== undefined) {
      const plainConnectionString = body.connectionString?.trim() || null
      patch.connectionString = plainConnectionString ? encryptConnectionString(plainConnectionString, config) : null
      // 连接串变更后自动重新同步 schema
      if (plainConnectionString) {
        try {
          if (existing.type === 'csv') {
            const parsed = plainConnectionString.trim().split('\n').filter(l => l.trim())
            if (parsed.length > 0) {
              const headers = parsed[0]!.split(',').map(h => h.trim())
              patch.schemaCache = { data: { fields: headers.map(name => ({ name, type: 'string' as const })) } }
            }
          } else {
            patch.schemaCache = await introspectSchema(existing.type as 'mysql' | 'postgres', plainConnectionString)
          }
          patch.lastSyncAt = new Date()
        } catch (err) {
          return c.json({ error: { code: 'SCHEMA_SYNC_FAILED', message: err instanceof Error ? err.message : String(err) } }, 502)
        }
      }
    }

    if (Object.keys(patch).length === 0) {
      return c.json({ error: { code: 'BAD_REQUEST', message: 'no fields to update' } }, 400)
    }

    await db.update(datasourceConnections).set(patch).where(eq(datasourceConnections.id, id))
    const [row] = await db.select().from(datasourceConnections).where(eq(datasourceConnections.id, id)).limit(1)
    return c.json({ id: row!.id, projectId: row!.projectId, name: row!.name, type: row!.type, connectionString: null, hasConnection: Boolean(row!.connectionString), schemaCache: row!.schemaCache })
  })

  app.delete('/:id', async (c) => {
    const id = c.req.param('id')
    const { db } = c.get('db')

    try {
      await assertDatasourceOwner(c, id)
    } catch {
      return c.json({ error: { code: 'FORBIDDEN', message: '无权访问该数据源' } }, 403)
    }

    const [existing] = await db.select().from(datasourceConnections).where(eq(datasourceConnections.id, id)).limit(1)
    if (!existing) return c.json({ error: { code: 'NOT_FOUND', message: 'datasource not found' } }, 404)

    // 级联清理缓存
    await db.delete(queryCache).where(eq(queryCache.datasourceId, id))
    await db.delete(datasourceConnections).where(eq(datasourceConnections.id, id))

    return c.body(null, 204)
  })

  return app
}

/* obsolete sample-query implementation removed */
/* function executeSampleQuery(
  tableName: string,
  request: QueryRequest,
  schema: DatasourceSchema['tables'],
): { fields: string[]; rows: unknown[][] } {
  const table = schema[tableName]
  if (!table) throw new Error('table not found')

  const allRows = getSampleRows(tableName)
  const fieldOps = request.fieldOps
  const visibleFields = table.fields
    .map(f => f.name)
    .filter(f => {
      const ops = fieldOps[f]
      return ops && !ops.hidden
    })

  // 过滤
  let rows = allRows.filter(row => {
    for (const f of visibleFields) {
      const ops = fieldOps[f]
      if (!ops?.filter) continue
      const match = ops.filter.trim().match(/^(>=|<=|!=|>|<|=)\s*(.+)/)
      if (!match) continue
      const [, op, operand] = match
      const value = row[f]
      const isNum = !Number.isNaN(parseFloat(operand as string))
      if (isNum) {
        const numValue = Number(value)
        const numOperand = parseFloat(operand as string)
        if (Number.isNaN(numValue)) return false
        if (op === '>' && !(numValue > numOperand)) return false
        if (op === '<' && !(numValue < numOperand)) return false
        if (op === '>=' && !(numValue >= numOperand)) return false
        if (op === '<=' && !(numValue <= numOperand)) return false
        if (op === '=' && numValue !== numOperand) return false
        if (op === '!=' && numValue === numOperand) return false
      } else {
        const strValue = String(value)
        const strOperand = (operand as string).replace(/["']/g, '')
        if (op === '=' && strValue !== strOperand) return false
        if (op === '!=' && strValue === strOperand) return false
      }
    }
    return true
  })

  // 排序
  for (const f of visibleFields) {
    const ops = fieldOps[f]
    if (ops?.sort && ops.sort !== 'none') {
      rows.sort((a, b) => {
        const va = a[f]
        const vb = b[f]
        const isNum = typeof va === 'number' && typeof vb === 'number'
        const dir = ops.sort === 'asc' ? 1 : -1
        if (isNum) return (va - vb) * dir
        return String(va).localeCompare(String(vb)) * dir
      })
    }
  }

  // 聚合：按非聚合字段分组，计算聚合字段
  const aggregateFields = visibleFields.filter(f => {
    const ops = fieldOps[f]
    return ops?.agg && ops.agg !== 'none'
  })
  const groupFields = visibleFields.filter(f => !aggregateFields.includes(f))

  if (aggregateFields.length > 0) {
    const groups = new Map<string, Record<string, number>[]>()
    for (const row of rows) {
      const key = groupFields.map(f => String(row[f] ?? '')).join('|')
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(row as Record<string, number>)
    }
    const aggregated: Record<string, unknown>[] = []
    for (const [key, groupRows] of groups) {
      const values = key.split('|')
      const r: Record<string, unknown> = {}
      for (let i = 0; i < groupFields.length; i++) r[groupFields[i]!] = values[i]
      for (const f of aggregateFields) {
        const nums = groupRows.map(row => Number(row[f])).filter(n => !Number.isNaN(n))
        const ops = fieldOps[f]
        if (!ops || ops.agg === 'none') continue
        if (ops.agg === 'sum') r[f] = nums.reduce((a, b) => a + b, 0)
        if (ops.agg === 'avg') r[f] = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
        if (ops.agg === 'count') r[f] = groupRows.length
        if (ops.agg === 'min') r[f] = nums.length ? Math.min(...nums) : 0
        if (ops.agg === 'max') r[f] = nums.length ? Math.max(...nums) : 0
      }
      aggregated.push(r)
    }
    rows = aggregated as Record<string, unknown>[]
  }

  return { fields: visibleFields, rows: rows.map(r => visibleFields.map(f => r[f])) }
}

function getSampleRows(tableName: string): Record<string, unknown>[] {
  if (tableName === 'orders') {
    return [
      { order_id: 1, customer_id: 101, product: 'MacBook', category: 'Electronics', amount: 1299, order_date: '2024-01-05', status: 'completed' },
      { order_id: 2, customer_id: 102, product: 'AirPods', category: 'Electronics', amount: 199, order_date: '2024-01-06', status: 'completed' },
      { order_id: 3, customer_id: 103, product: 'Nike', category: 'Sports', amount: 89, order_date: '2024-01-07', status: 'pending' },
      { order_id: 4, customer_id: 101, product: 'Coffee', category: 'Food', amount: 12, order_date: '2024-01-08', status: 'completed' },
      { order_id: 5, customer_id: 104, product: 'Desk', category: 'Furniture', amount: 350, order_date: '2024-01-09', status: 'cancelled' },
    ]
  }
  if (tableName === 'customers') {
    return [
      { customer_id: 101, name: 'Alice', age: 30, city: 'Beijing', signup_date: '2023-06-01' },
      { customer_id: 102, name: 'Bob', age: 24, city: 'Shanghai', signup_date: '2023-07-12' },
      { customer_id: 103, name: 'Carol', age: 29, city: 'Shenzhen', signup_date: '2023-08-05' },
      { customer_id: 104, name: 'Dave', age: 35, city: 'Beijing', signup_date: '2023-09-20' },
    ]
  }
  if (tableName === 'products') {
    return [
      { product_id: 1, product_name: 'MacBook', category: 'Electronics', price: 1299, stock: 42 },
      { product_id: 2, product_name: 'AirPods', category: 'Electronics', price: 199, stock: 150 },
      { product_id: 3, product_name: 'Nike', category: 'Sports', price: 89, stock: 80 },
      { product_id: 4, product_name: 'Desk', category: 'Furniture', price: 350, stock: 20 },
      { product_id: 5, product_name: 'Coffee', category: 'Food', price: 12, stock: 300 },
    ]
  }
  return []
}
*/
