import 'dotenv/config'
import { migrate } from 'drizzle-orm/mysql2/migrator'
import { createDb } from './client'
import { getConfig } from '../config/env'

const { db, pool } = createDb(getConfig())
await migrate(db, { migrationsFolder: './drizzle' })
await pool.end()
console.log('Database migrations applied')
