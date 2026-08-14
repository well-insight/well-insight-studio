import { timestamp, varchar } from 'drizzle-orm/mysql-core'
import { mysqlTable } from 'drizzle-orm/mysql-core'

export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  email: varchar('email', { length: 320 }).notNull().unique(),
  displayName: varchar('display_name', { length: 120 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
