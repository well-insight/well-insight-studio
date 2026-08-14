import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { z } from 'zod'

const envFile = fileURLToPath(new URL('../../.env', import.meta.url))
dotenv.config({ path: envFile })

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  APP_ORIGIN: z.string().url().default('http://localhost:5173'),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_SSL: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  DB_CONNECTION_LIMIT: z.coerce.number().int().min(1).max(50).default(5),
})

export type AppConfig = z.infer<typeof envSchema>

export function getConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  return envSchema.parse(env)
}
