import { json, timestamp, varchar } from 'drizzle-orm/mysql-core'
import { mysqlTable } from 'drizzle-orm/mysql-core'
import type { DatasourceSchema } from '@well-insight/shared'

/**
 * 数据源连接表。
 * 连接串以明文存储在数据库中，由后端读取后创建 mysql2 连接池。
 * 生产环境建议改为加密存储 + 环境密钥解密。
 */
export const datasourceConnections = mysqlTable('datasource_connections', {
  id: varchar('id', { length: 36 }).primaryKey(),
  projectId: varchar('project_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 20 }).notNull().$type<'mysql' | 'postgres' | 'csv'>().default('mysql'),
  connectionString: varchar('connection_string', { length: 2048 }),
  schemaCache: json('schema_cache').$type<DatasourceSchema['tables']>().notNull().default({}),
  lastSyncAt: timestamp('last_sync_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().onUpdateNow(),
})
