import type { QueryResponse } from '@well-insight/shared'
import { json, mysqlTable, timestamp, varchar  } from 'drizzle-orm/mysql-core'

/** 查询结果缓存表（TTL 60s） */
export const queryCache = mysqlTable('query_cache', {
  id: varchar('id', { length: 36 }).primaryKey(),
  datasourceId: varchar('datasource_id', { length: 36 }).notNull(),
  queryHash: varchar('query_hash', { length: 64 }).notNull(),
  resultData: json('result_data').$type<QueryResponse>().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
