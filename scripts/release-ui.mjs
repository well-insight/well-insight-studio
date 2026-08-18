import { execFileSync, execSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = new Set(process.argv.slice(2))
const noPush = args.has('--no-push')

const releasePaths = [
  'packages/ui/package.json',
  'packages/ui/CHANGELOG.md',
  'packages/ui/CHANGELOG.en.md',
  '.changeset',
]

function run(command, { allowFail = false } = {}) {
  try {
    execSync(command, { cwd: root, stdio: 'inherit', shell: true })
    return true
  } catch (error) {
    if (allowFail) return false
    throw error
  }
}

function git(gitArgs, { allowFail = false, stdio = 'pipe' } = {}) {
  try {
    const output = execFileSync('git', gitArgs, {
      cwd: root,
      encoding: 'utf8',
      stdio: stdio === 'inherit' ? 'inherit' : ['ignore', 'pipe', 'pipe'],
    })
    return typeof output === 'string' ? output.trim() : ''
  } catch (error) {
    if (allowFail) return ''
    throw error
  }
}

function readUiVersion() {
  const pkg = JSON.parse(readFileSync(join(root, 'packages/ui/package.json'), 'utf8'))
  const version = String(pkg.version ?? '').trim()
  if (!/^\d+\.\d+\.\d+/.test(version)) {
    throw new Error(`Invalid @well-design/ui version: ${pkg.version}`)
  }
  return version
}

function pendingChangesets() {
  const dir = join(root, '.changeset')
  if (!existsSync(dir)) return []
  return readdirSync(dir).filter((name) => name.endsWith('.md') && name !== 'README.md')
}

function hasStagedChanges() {
  return Boolean(git(['diff', '--cached', '--name-only'], { allowFail: true }))
}

console.log('Releasing @well-design/ui')

if (pendingChangesets().length > 0) {
  console.log('Applying pending changesets…')
  run('pnpm exec changeset version')
} else {
  console.log(`No pending changesets; releasing current version ${readUiVersion()}`)
}

const version = readUiVersion()
run(`node scripts/release-git.mjs --branch --checkout`)

const existing = git(['ls-files', '--others', '--modified', '--exclude-standard'], { allowFail: true })
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)
const unexpected = existing.filter((file) => !releasePaths.some((path) => file === path || file.startsWith(`${path}/`)))
if (unexpected.length) {
  console.warn('Uncommitted files outside the release bump (left unstaged):')
  for (const file of unexpected) console.warn(`  ${file}`)
}

git(['add', '--', ...releasePaths.filter((path) => existsSync(join(root, path)))], { allowFail: true })
if (hasStagedChanges()) {
  git(['commit', '-m', `release: @well-design/ui v${version}`], { stdio: 'inherit' })
} else {
  console.log('No version files to commit')
}

run('pnpm --filter @well-design/ui build')
run('pnpm exec changeset publish')
run('node scripts/release-git.mjs --tag --branch')

if (noPush) {
  console.log(`Released v${version} locally. Push with:\n  git push -u origin HEAD --follow-tags`)
  process.exit(0)
}

run(`node scripts/release-git.mjs --tag --branch --push`)
const packageTag = `@well-design/ui@${version}`
if (git(['rev-parse', '--verify', '--quiet', `refs/tags/${packageTag}`], { allowFail: true })) {
  git(['push', 'origin', `refs/tags/${packageTag}`], { allowFail: true, stdio: 'inherit' })
}

console.log(`Released @well-design/ui v${version} (tag v${version}, branch release/${version})`)
