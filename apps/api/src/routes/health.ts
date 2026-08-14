import { Hono } from 'hono'
import type { AppBindings } from '../types/context'
import type { HealthResponse } from '@well-design/shared'

export function createHealthRoutes() {
  const router = new Hono<AppBindings>()
  router.get('/', (context) => {
    const response: HealthResponse = { status: 'ok', service: 'api' }
    return context.json(response)
  })
  return router
}
