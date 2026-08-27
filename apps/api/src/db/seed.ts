import type { AppConfig } from '../config/env'
import type { createDb } from './client'
import { eq, isNull } from 'drizzle-orm'
import { hashPassword } from '../services/auth'
import { projects } from './schema/projects'
import { users } from './schema/users'

const DEFAULT_ADMIN = {
  username: 'admin',
  email: 'admin@well-insight.com',
  password: 'Aa@123456',
  displayName: '管理员',
}

export async function seedDefaultAdmin({ db }: ReturnType<typeof createDb>, config: AppConfig) {
  try {
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, DEFAULT_ADMIN.email)).limit(1)
    let adminId = existing[0]?.id
    if (!adminId) {
      adminId = crypto.randomUUID()
      await db.insert(users).values({
        id: adminId,
        username: DEFAULT_ADMIN.username,
        email: DEFAULT_ADMIN.email,
        displayName: DEFAULT_ADMIN.displayName,
        passwordHash: await hashPassword(DEFAULT_ADMIN.password),
      })
      console.log(`[seed] default admin user "${DEFAULT_ADMIN.email}" created`)
    }

    // 认证接入前创建的项目没有 user_id，归属给默认管理员，避免登录后丢失。
    await db.update(projects).set({ userId: adminId }).where(eq(projects.userId, ''))
    await db.update(projects).set({ userId: adminId }).where(isNull(projects.userId))
  } catch (err) {
    console.error('[seed] failed to create default admin:', err instanceof Error ? err.message : String(err))
  }
}
