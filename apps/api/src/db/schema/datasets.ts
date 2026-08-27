import { json, int, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core'

export const datasetFolders = mysqlTable('dataset_folders', {
  id: varchar('id', { length: 36 }).primaryKey(),
  projectId: varchar('project_id', { length: 36 }),
  parentId: varchar('parent_id', { length: 36 }),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 2000 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().onUpdateNow(),
})

export const datasets = mysqlTable('datasets', {
  id: varchar('id', { length: 36 }).primaryKey(),
  projectId: varchar('project_id', { length: 36 }),
  folderId: varchar('folder_id', { length: 36 }),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 5000 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().onUpdateNow(),
})

export const datasetFields = mysqlTable('dataset_fields', {
  id: varchar('id', { length: 36 }).primaryKey(),
  datasetId: varchar('dataset_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  fieldType: varchar('field_type', { length: 20 }).$type<'text' | 'number' | 'datetime'>().notNull(),
  sortOrder: int('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const datasetRows = mysqlTable('dataset_rows', {
  id: varchar('id', { length: 36 }).primaryKey(),
  datasetId: varchar('dataset_id', { length: 36 }).notNull(),
  values: json('values_json').$type<Record<string, string | number | null>>().notNull(),
  sortOrder: int('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
