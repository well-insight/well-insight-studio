import { sql } from 'drizzle-orm'
import { createDb } from './client'
import { getConfig } from '../config/env'

const { db, pool } = createDb(getConfig())
await db.execute(sql`select 1`)
await pool.end()
console.log('Database connection OK')
