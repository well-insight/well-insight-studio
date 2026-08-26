import { execFile } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { promisify } from 'node:util'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'
import dotenv from 'dotenv'

const execFileAsync = promisify(execFile)
const apiRoot = path.dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
dotenv.config({ path: path.join(apiRoot, '.env') })

const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
const missing = required.filter(name => !process.env[name])
if (missing.length > 0) {
  throw new Error(`Missing database configuration: ${missing.join(', ')}`)
}

const backupDir = path.join(apiRoot, 'backups')
await mkdir(backupDir, { recursive: true })

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('Z', 'Z')
const output = path.join(backupDir, `${process.env.DB_NAME}-${timestamp}.sql`)
const args = [
  '--host', process.env.DB_HOST,
  '--port', String(process.env.DB_PORT),
  '--user', process.env.DB_USER,
  '--single-transaction',
  '--quick',
  '--routines',
  '--events',
  '--triggers',
  '--hex-blob',
  '--result-file', output,
  process.env.DB_NAME,
]

try {
  await execFileAsync('mysqldump', args, {
    env: { ...process.env, MYSQL_PWD: process.env.DB_PASSWORD },
    windowsHide: true,
    maxBuffer: 1024 * 1024 * 4,
  })
  console.log(`Database backup saved: ${path.relative(process.cwd(), output)}`)
} catch (error) {
  console.error('[backup] mysqldump failed:', error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
