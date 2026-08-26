import { getConfig } from '../config/env'
import { createDb } from './client'
import { seedDefaultAdmin } from './seed'

const config = getConfig()
const dbInstance = createDb(config)
seedDefaultAdmin(dbInstance, config).then(() => {
  console.log('seed done')
  dbInstance.pool.end().then(() => process.exit(0))
}).catch((err) => {
  console.error(err)
  dbInstance.pool.end().then(() => process.exit(1))
})
