import { execFileSync } from 'node:child_process'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

const port = Number(process.argv[2] ?? 3000)
const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const backupScript = path.join(scriptDir, 'backup-database.mjs')

function backupBeforeStop() {
  try {
    execFileSync(process.execPath, [backupScript], { stdio: 'inherit', windowsHide: true })
  } catch {
    console.warn('[backup] Could not create a database backup before stopping the process.')
  }
}

function canListen(host) {
  return new Promise(resolve => {
    const server = net.createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => server.close(() => resolve(true)))
    server.listen(port, host)
  })
}

async function isPortAvailable() {
  const [ipv4, ipv6] = await Promise.all([
    canListen('127.0.0.1'),
    canListen('::1'),
  ])
  return ipv4 && ipv6
}

async function waitForPortRelease(timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await isPortAvailable()) return true
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  return isPortAvailable()
}

function findWindowsPids() {
  const output = execFileSync('netstat.exe', ['-ano'], { encoding: 'utf8', windowsHide: true })
  const portPattern = new RegExp(`(?:^|:)${port}\\s`, 'i')
  return [...new Set(
    output
      .split(/\r?\n/)
      .filter(line => /LISTENING\s+\d+\s*$/i.test(line) && portPattern.test(line))
      .map(line => line.trim().split(/\s+/).at(-1))
      .filter(pid => pid && pid !== String(process.pid)),
  )]
}

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`Invalid port: ${port}`)
  process.exit(1)
}

try {
  let activePids = []
  if (process.platform === 'win32') {
    try {
      activePids = findWindowsPids()
    } catch (error) {
      if (error?.status !== 1) throw error
    }
  } else {
    const output = execFileSync('sh', ['-c', `lsof -tiTCP:${port} -sTCP:LISTEN || true`], { encoding: 'utf8' })
    activePids = output.split(/\s+/).filter(pid => pid && pid !== String(process.pid))
  }

  if (activePids.length > 0) backupBeforeStop()
  for (const pid of activePids) {
    if (process.platform === 'win32') {
      execFileSync('taskkill.exe', ['/PID', pid, '/T', '/F'], { stdio: 'ignore', windowsHide: true })
    } else {
      process.kill(Number(pid), 'SIGTERM')
    }
    console.log(`Freed port ${port} by stopping PID ${pid}`)
  }

  if (activePids.length > 0 && !(await waitForPortRelease())) {
    console.error(`Port ${port} is still occupied after stopping its process.`)
    process.exit(1)
  }
} catch (error) {
  console.error(`Could not free port ${port}:`, error instanceof Error ? error.message : String(error))
  process.exit(1)
}
