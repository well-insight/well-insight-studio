import type { createDb } from '../db/client'
import type { queryCache } from '../db/schema/queryCache'
import { lt } from 'drizzle-orm'

type DbContext = ReturnType<typeof createDb>

/**
 * 启动 query_cache 过期缓存清理任务。
 * 每 10 分钟清理一次早于当前时间的记录。
 */
export function startCacheCleanupTask(db: DbContext['db'], intervalMs = 10 * 60 * 1000) {
  async function run() {
    try {
      const cacheTable = db._.fullSchema.queryCache as typeof queryCache
      await db.delete(cacheTable).where(lt(cacheTable.expiresAt, new Date()))
    } catch (err) {
      console.error('[cache-cleanup] failed', err)
    }
  }

  // 立即执行一次，然后按间隔循环
  void run()
  const timer = setInterval(run, intervalMs)

  return {
    stop: () => clearInterval(timer),
  }
}
