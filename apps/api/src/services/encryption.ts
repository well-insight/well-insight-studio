import type { AppConfig } from '../config/env'
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ENCRYPTED_PREFIX = 'enc:'

function deriveKey(keyHex: string): Buffer {
  if (!/^[0-9a-f]{64}$/i.test(keyHex)) {
    throw new Error('DS_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)')
  }
  return Buffer.from(keyHex, 'hex')
}

export function isEncrypted(value: string | null | undefined): boolean {
  return !!value && value.startsWith(ENCRYPTED_PREFIX)
}

export function encryptConnectionString(plain: string, config: AppConfig): string {
  if (!config.DS_ENCRYPTION_KEY) return plain
  if (isEncrypted(plain)) return plain

  const key = deriveKey(config.DS_ENCRYPTION_KEY)
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  const payload = Buffer.concat([iv, authTag, encrypted]).toString('base64')
  return `${ENCRYPTED_PREFIX}${payload}`
}

export function decryptConnectionString(encrypted: string | null, config: AppConfig): string | null {
  if (!encrypted) return null
  if (!config.DS_ENCRYPTION_KEY) return encrypted
  if (!isEncrypted(encrypted)) return encrypted

  const key = deriveKey(config.DS_ENCRYPTION_KEY)
  const payload = Buffer.from(encrypted.slice(ENCRYPTED_PREFIX.length), 'base64')
  if (payload.length < 28) throw new Error('invalid encrypted payload')

  const iv = payload.subarray(0, 12)
  const authTag = payload.subarray(12, 28)
  const ciphertext = payload.subarray(28)

  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return decrypted.toString('utf8')
}
