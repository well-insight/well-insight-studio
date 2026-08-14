import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { AppConfig } from './config/env'
import { errorHandler } from './middleware/error-handler'
import { requestId } from './middleware/request-id'
import { createDocsRoutes } from './routes/docs'
import { createHealthRoutes } from './routes/health'
import type { AppBindings } from './types/context'

export function createApp(config?: AppConfig) {
  const app = new Hono<AppBindings>()

  app.use('*', requestId)
  app.use('/api/*', cors({ origin: config?.APP_ORIGIN ?? 'http://localhost:5173' }))
  app.route('/health', createHealthRoutes())
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
