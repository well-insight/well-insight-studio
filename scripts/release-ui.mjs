import { execFileSync, execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { formatChangelogBody, prepareUiRelease, root } from './ui-changelog.mjs'

const args = process.argv.slice(2)
const noPush = args.includes('--no-push')
const dryRun = args.includes('--dry-run')
const force = args.includes('--force')
const bumpArg = args.find((item) => item === '--major' || item === '--minor' || item === '--patch')
const bump = bumpArg ? bumpArg.slice(2) : undefined

let commitMode = 'interactive'
if (args.includes('--all')) commitMode = 'all'
else if (args.includes('--ui-only')) commitMode = 'ui'
else if (args.includes('--none')) commitMode = 'none'

const releasePaths = ['packages/ui/package.json', 'packages/ui/CHANGELOG.md', 'packages/ui/CHANGELOG.en.md']

function run(command) {
  execSync(command, { cwd: root, stdio: 'inherit', shell: true })
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

function hasStagedChanges() {
  return Boolean(git(['diff', '--cached', '--name-only'], { allowFail: true }))
}

console.log('Releasing @well-design/ui')

const dirtyUi = git(['status', '--porcelain', '--', 'packages/ui'], { allowFail: true })
if (dirtyUi) {
  console.warn('packages/ui has uncommitted files; commit them first if they should appear in CHANGELOG.')
}

const plan = await prepareUiRelease({ bump, dryRun, allowEmpty: force, commitMode })

if (plan.firstRelease) {
  console.log(`First release of current version ${plan.version} (no v* tag yet)`)
} else {
  console.log(
    `${plan.previousTag} → v${plan.version} (${plan.bump}, ${plan.commits.length} changelog entr${plan.commits.length === 1 ? 'y' : 'ies'})`,
  )
}

if (dryRun) {
  if (!plan.firstRelease) {
    console.log(`\nCHANGELOG.md preview:\n\n## ${plan.version}\n\n${formatChangelogBody(plan.commits, 'zh-CN')}\n`)
  }
  process.exit(0)
}

run('node scripts/release-git.mjs --branch --checkout')

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
  git(['commit', '-m', `release: @well-design/ui v${plan.version}`], { stdio: 'inherit' })
} else {
  console.log('No version files to commit')
}

run('pnpm --filter @well-design/ui build')
run('pnpm --filter @well-design/ui publish --access public --no-git-checks')
run('node scripts/release-git.mjs --tag --branch')

if (noPush) {
  console.log(`Released v${plan.version} locally. Push with:\n  git push -u origin HEAD --follow-tags`)
  process.exit(0)
}

run('node scripts/release-git.mjs --tag --branch --push')
console.log(`Released @well-design/ui v${plan.version} (tag v${plan.version}, branch release/${plan.version})`)
