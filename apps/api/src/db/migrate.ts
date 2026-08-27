import { migrate } from 'drizzle-orm/mysql2/migrator'
import { getConfig } from '../config/env'
import { createDb } from './client'
import 'dotenv/config'

const { db, pool } = createDb(getConfig())
await migrate(db, { migrationsFolder: './drizzle' })
await pool.end()
console.log('Database migrations applied')
