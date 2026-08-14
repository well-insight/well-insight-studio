import { sql } from 'drizzle-orm'
import { createDb } from './client'
import { getConfig } from '../config/env'

const config = getConfig()
const { db, pool } = createDb(config)
const result = await db.execute(sql`SHOW FULL TABLES`)
await pool.end()

for (const row of result[0] as unknown as Record<string, unknown>[]) {
  const [tableName] = Object.values(row)
  if (typeof tableName === 'string') console.log(tableName)
}
