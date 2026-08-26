import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { serve } from '@hono/node-server'
import { createApp } from './app'
import { getConfig } from './config/env'
import { createDb } from './db/client'
import { seedDefaultAdmin } from './db/seed'
import { startCacheCleanupTask } from './services/cache-cleanup'

const execFileAsync = promisify(execFile)
const backupScript = fileURLToPath(new URL('../scripts/backup-database.mjs', import.meta.url))

const config = getConfig()
const dbInstance = createDb(config)
const cleanup = startCacheCleanupTask(dbInstance.db)

seedDefaultAdmin(dbInstance, config).then(() => {
  // 复用 seed 使用的同一个连接池，避免为 HTTP App 再创建一套连接。
  const app = createApp(config, () => dbInstance)
  serve({ fetch: app.fetch, port: config.PORT })
  console.log(`API listening on http://localhost:${config.PORT}`)
}).catch((error) => {
  console.error('[startup] failed', error)
  cleanup.stop()
  void dbInstance.pool.end().finally(() => process.exit(1))
})

let shuttingDown = false

async function shutdown() {
  if (shuttingDown) return
  shuttingDown = true
  cleanup.stop()
  try {
    await execFileAsync(process.execPath, [backupScript], { windowsHide: true })
  } catch (error) {
    console.error('[backup] database backup failed; continuing shutdown:', error instanceof Error ? error.message : String(error))
  }
  await dbInstance.pool.end()
  process.exit(0)
}

process.once('SIGTERM', shutdown)
process.once('SIGINT', shutdown)
