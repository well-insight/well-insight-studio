import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(root, 'dist')

mkdirSync(distDir, { recursive: true })
copyFileSync(join(root, 'src', 'styles.css'), join(distDir, 'styles.css'))
