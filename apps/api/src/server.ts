import { serve } from '@hono/node-server'
import { createApp } from './app'
import { getConfig } from './config/env'

const config = getConfig()
serve({ fetch: createApp(config).fetch, port: config.PORT })
console.log(`API listening on http://localhost:${config.PORT}`)
