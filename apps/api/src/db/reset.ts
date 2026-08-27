import { sql } from 'drizzle-orm'
import { getConfig } from '../config/env'
import { createDb } from './client'

const tables = [
  '__drizzle_migrations',
  'app_page_menus',
  'applications',
  'dataset_fields',
  'dataset_folders',
  'dataset_rows',
  'datasets',
  'form_records',
  'lowcode_pages',
  'page_folders',
  'pages',
  'permission_rules',
  'projects',
  'role_permissions',
  'roles',
  'user_roles',
  'users',
] as const

const { db, pool } = createDb(getConfig())

try {
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`)
  for (const table of tables) {
    await db.execute(sql.raw(`DROP TABLE IF EXISTS \`${table}\``))
  }
  console.log(`Dropped ${tables.length} tables`)
} finally {
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`)
  await pool.end()
}
