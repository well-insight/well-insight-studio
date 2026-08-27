import { sql } from 'drizzle-orm'
import { getConfig } from '../config/env'
import { createDb } from './client'

const { db, pool } = createDb(getConfig())
await db.execute(sql`select 1`)
await pool.end()
console.log('Database connection OK')
