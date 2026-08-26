import { beforeEach, describe, expect, it } from 'vitest'
import type { ProjectConfig, QueryRequest } from '@well-insight/shared'
import { createApp } from '../src/app'
import { getConfig, type AppConfig } from '../src/config/env'
import { createDb } from '../src/db/client'
import * as schema from '../src/db/schema'

const testConfig: AppConfig = {
  ...getConfig({
    NODE_ENV: 'test',
    PORT: '3001',
    APP_ORIGIN: 'http://localhost:5181',
    DB_HOST: 'mysql6.sqlpub.com',
    DB_PORT: '3311',
    DB_NAME: 'well_design',
    DB_USER: 'well_admin',
    DB_PASSWORD: 'ol5VyTP8qjAeGAnG',
    DB_SSL: 'false',
    DB_CONNECTION_LIMIT: '1',
  }),
}

type TestApp = ReturnType<typeof createApp>

async function registerAndLogin(app: TestApp, email = `test-${crypto.randomUUID()}@example.com`) {
  const password = 'password123'
  const registerRes = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName: 'Test User' }),
  })
  expect(registerRes.status).toBe(201)
  const setCookie = registerRes.headers.get('set-cookie') ?? ''
  return { email, password, cookies: setCookie }
}

async function authRequest(app: TestApp, path: string, init: RequestInit = {}, cookies = '') {
  return app.request(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(cookies ? { Cookie: cookies } : {}),
      ...init.headers,
    },
  })
}

async function createProject(app: TestApp, cookies: string, name: string, configPayload: ProjectConfig) {
  const res = await authRequest(app, '/api/projects', {
    method: 'POST',
    body: JSON.stringify({ name, config: configPayload }),
  }, cookies)
  return res.json() as Promise<{ id: string }>
}

async function createDatasource(app: TestApp, projectId: string, name = 'orders sample') {
  const { db } = createDb(testConfig)
  const id = crypto.randomUUID()
  await db.insert(schema.datasourceConnections).values({
    id,
    projectId,
    name,
    type: 'mysql',
    schemaCache: {
      orders: {
        fields: [
          { name: 'order_id', type: 'number' },
          { name: 'amount', type: 'number' },
          { name: 'category', type: 'string' },
        ],
      },
    },
  } as any)
  return id
}

describe('datasources routes', () => {
  beforeEach(async () => {
    const { db } = createDb(testConfig)
    await db.delete(schema.queryCache)
    await db.delete(schema.datasourceConnections)
    await db.delete(schema.projects)
    await db.delete(schema.users)
  })

  it('returns 401 when not authenticated', async () => {
    const app = createApp(testConfig)
    const res = await app.request('/api/datasources/00000000-0000-0000-0000-000000000000/schema')
    expect(res.status).toBe(401)
  })

  it('returns 403 for unknown or unowned datasource schema', async () => {
    const app = createApp(testConfig)
    const { cookies } = await registerAndLogin(app)
    const res = await authRequest(app, '/api/datasources/00000000-0000-0000-0000-000000000000/schema', {}, cookies)
    expect(res.status).toBe(403)
  })

  it('returns schema for a datasource', async () => {
    const app = createApp(testConfig)
    const { cookies } = await registerAndLogin(app)
    const project = await createProject(app, cookies, 'schema test', { version: 1, widgets: [], canvas: { zoom: 1 } })
    const dsId = await createDatasource(app, project.id, 'orders sample')

    const res = await authRequest(app, `/api/datasources/${dsId}/schema`, {}, cookies)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.tables.orders.fields).toHaveLength(3)
  })

  it('queries sample data with filter', async () => {
    const app = createApp(testConfig)
    const { cookies } = await registerAndLogin(app)
    const project = await createProject(app, cookies, 'query test', { version: 1, widgets: [], canvas: { zoom: 1 } })
    const dsId = await createDatasource(app, project.id, 'orders sample')

    const request: QueryRequest = {
      table: 'orders',
      fieldOps: {
        order_id: { alias: 'order_id', agg: 'none', sort: 'none', filter: '', hidden: false },
        amount: { alias: 'amount', agg: 'none', sort: 'none', filter: '> 200', hidden: false },
        category: { alias: 'category', agg: 'none', sort: 'none', filter: '', hidden: true },
      },
    }

    const res = await authRequest(app, `/api/datasources/${dsId}/query`, {
      method: 'POST',
      body: JSON.stringify(request),
    }, cookies)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.fields).toEqual(['order_id', 'amount'])
    expect(body.rows.length).toBeGreaterThan(0)
    expect(body.rows.every((r: unknown[]) => (r[1] as number) > 200)).toBe(true)
  })

  it('queries sample data with aggregation', async () => {
    const app = createApp(testConfig)
    const { cookies } = await registerAndLogin(app)
    const project = await createProject(app, cookies, 'agg test', { version: 1, widgets: [], canvas: { zoom: 1 } })
    const dsId = await createDatasource(app, project.id, 'orders sample')

    const request: QueryRequest = {
      table: 'orders',
      fieldOps: {
        category: { alias: 'category', agg: 'none', sort: 'none', filter: '', hidden: false },
        amount: { alias: 'amount', agg: 'sum', sort: 'none', filter: '', hidden: false },
      },
    }

    const res = await authRequest(app, `/api/datasources/${dsId}/query`, {
      method: 'POST',
      body: JSON.stringify(request),
    }, cookies)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.fields).toEqual(['category', 'amount'])
    expect(body.rows.length).toBeGreaterThan(0)
  })

  it('returns 400 for invalid query body', async () => {
    const app = createApp(testConfig)
    const { cookies } = await registerAndLogin(app)
    const project = await createProject(app, cookies, 'invalid test', { version: 1, widgets: [], canvas: { zoom: 1 } })
    const dsId = await createDatasource(app, project.id, 'orders sample')

    const res = await authRequest(app, `/api/datasources/${dsId}/query`, {
      method: 'POST',
      body: JSON.stringify({ table: 'orders' }),
    }, cookies)
    expect(res.status).toBe(400)
  })
})
