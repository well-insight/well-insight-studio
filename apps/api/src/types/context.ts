import type { AppConfig } from '../config/env'

export interface AppBindings {
  Variables: {
    requestId: string
    config: AppConfig
  }
}
