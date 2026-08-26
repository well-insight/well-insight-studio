import { serve } from '@hono/node-server'
import { createApp } from './app'
import { getConfig } from './config/env'
import { createDb } from './db/client'
import { seedDefaultAdmin } from './db/seed'
import { startCacheCleanupTask } from './services/cache-cleanup'

const config = getConfig()
const dbInstance = createDb(config)
const cleanup = startCacheCleanupTask(dbInstance.db)

seedDefaultAdmin(dbInstance, config).then(() => {
  serve({ fetch: createApp(config).fetch, port: config.PORT })
  console.log(`API listening on http://localhost:${config.PORT}`)
})
console.log(`API listening on http://localhost:${config.PORT}`)

process.on('SIGTERM', () => {
  cleanup.stop()
  process.exit(0)
})
