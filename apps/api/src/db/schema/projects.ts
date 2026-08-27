import type { ProjectConfig } from '@well-insight/shared'
import { json, mysqlTable, timestamp, varchar  } from 'drizzle-orm/mysql-core'

/**
 * 项目表：存储画布完整配置（JSON）。
 * 当前 MVP 无用户体系，user_id 先为可空字符串，后续认证接入后改为 FK + notNull。
 */
export const projects = mysqlTable('projects', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 36 }),
  config: json('config').$type<ProjectConfig>().notNull().default({
    version: 1,
    widgets: [],
    canvas: { zoom: 1 },
  } as ProjectConfig),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().onUpdateNow(),
})
