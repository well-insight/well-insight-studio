import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { z } from 'zod'

const envFile = fileURLToPath(new URL('../../.env', import.meta.url))
dotenv.config({ path: envFile })

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  APP_ORIGIN: z.string().url().default('http://localhost:5181'),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_SSL: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  DB_CONNECTION_LIMIT: z.coerce.number().int().min(1).max(50).default(5),
  /** 数据源连接串加密密钥；必须是 32 字节 hex 字符串 */
  DS_ENCRYPTION_KEY: z.string().length(64).optional(),
  /** JWT 签名密钥 */
  JWT_SECRET: z.string().min(32).default('change-me-in-production'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
})

export type AppConfig = z.infer<typeof envSchema>

export function getConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  return envSchema.parse(env)
}
