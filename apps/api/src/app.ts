import type { AppConfig } from './config/env'
import type { AppBindings } from './types/context'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getConfig } from './config/env'
import { createDb } from './db/client'
import { errorHandler } from './middleware/error-handler'
import { requestId } from './middleware/request-id'
import { createAuthRoutes } from './routes/auth'
import { createDatasourcesRoutes } from './routes/datasources'
import { createDocsRoutes } from './routes/docs'
import { createHealthRoutes } from './routes/health'
import { createProjectsRoutes } from './routes/projects'

export function createApp(config?: AppConfig, dbFactory = createDb) {
  const app = new Hono<AppBindings>()
  const resolvedConfig = config ?? getConfig()
  // 每个 App 实例只创建一个连接池，所有请求复用它。
  const dbInstance = dbFactory(resolvedConfig)

  app.use('*', requestId)
  app.use(async (c, next) => {
    c.set('db', dbInstance)
    c.set('config', resolvedConfig)
    await next()
  })
  app.use('/api/*', cors({ origin: resolvedConfig.APP_ORIGIN, credentials: true }))
  app.route('/health', createHealthRoutes())
  app.route('/api/auth', createAuthRoutes())
  app.route('/api/projects', createProjectsRoutes())
  app.route('/api/datasources', createDatasourcesRoutes())
  app.route('/', createDocsRoutes())

  app.get('/api/routes', (context) => {
    const routes = Array.from(
      new Map(
        app.routes.map(({ method, path }) => [`${method} ${path}`, { method, path }]),
      ).values(),
    ).sort((left, right) => {
      const methodOrder = left.method.localeCompare(right.method)
      return methodOrder || left.path.localeCompare(right.path)
    })

    return context.json({ count: routes.length, routes })
  })

  app.onError(errorHandler)

  return app
}
