import type { AppConfig } from '../config/env'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'

export function createDb(config: AppConfig) {
  const pool = mysql.createPool({
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    connectionLimit: config.DB_CONNECTION_LIMIT,
    waitForConnections: true,
    enableKeepAlive: true,
    ssl: config.DB_SSL ? {} : undefined,
  })

  return { db: drizzle(pool, { schema, mode: 'default' }), pool }
}
