import { eq } from 'drizzle-orm'
import type { AppConfig } from '../config/env'
import { hashPassword } from '../services/auth'
import { users } from './schema/users'
import type { createDb } from './client'

const DEFAULT_ADMIN = {
  email: 'admin@well-insight.com',
  password: 'Aa@123456',
  displayName: '管理员',
}

export async function seedDefaultAdmin({ db }: ReturnType<typeof createDb>, config: AppConfig) {
  try {
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, DEFAULT_ADMIN.email)).limit(1)
    if (existing.length > 0) return

    const id = crypto.randomUUID()
    await db.insert(users).values({
      id,
      email: DEFAULT_ADMIN.email,
      displayName: DEFAULT_ADMIN.displayName,
      passwordHash: await hashPassword(DEFAULT_ADMIN.password),
    })
    console.log(`[seed] default admin user "${DEFAULT_ADMIN.email}" created`)
  } catch (err) {
    console.error('[seed] failed to create default admin:', err instanceof Error ? err.message : String(err))
  }
}
