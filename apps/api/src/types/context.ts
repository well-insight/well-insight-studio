import type { createDb } from '../db/client'
import type { AppConfig } from '../config/env'

export type AppBindings = {
  Variables: {
    requestId: string
    db: ReturnType<typeof createDb>
    config: AppConfig
  }
}
