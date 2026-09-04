import { serve } from '@hono/node-server'
import { createApp } from './app'
import { getConfig } from './config/env'

const config = getConfig()
const app = createApp(config)

serve({ fetch: app.fetch, port: config.PORT })
console.log(`API listening on http://localhost:${config.PORT}`)
