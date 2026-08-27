import type { AppConfig } from '../config/env'
import type { createDb } from '../db/client'

export interface AppBindings {
  Variables: {
    requestId: string
    db: ReturnType<typeof createDb>
    config: AppConfig
  }
}
