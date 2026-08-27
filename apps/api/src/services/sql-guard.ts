import type { FieldOperation } from '@well-insight/shared'

const FORBIDDEN_KEYWORDS = [
  'insert',
  'update',
  'delete',
  'drop',
  'truncate',
  'alter',
  'create',
  'grant',
  'revoke',
  'merge',
  'replace',
  'call',
  'execute',
  'exec',
  'load',
]

const ALLOWED_IDENTIFIER = /^[a-z_]\w*$/i

export function validateIdentifier(name: string): boolean {
  return ALLOWED_IDENTIFIER.test(name)
}

export function validateTableName(name: string): boolean {
  return validateIdentifier(name)
}

/** 确保最终 SQL 只包含 SELECT 查询；我们的 buildQuery 生成的是 SELECT，但再校验一次更保险 */
export function assertSelectOnly(sql: string): void {
  const normalized = sql.replace(/`/g, '').replace(/"/g, '').replace(/\$/g, '?').toLowerCase()
  for (const keyword of FORBIDDEN_KEYWORDS) {
    // 使用单词边界匹配，避免误伤字段名包含子串
    const re = new RegExp(`\\b${keyword}\\b`)
    if (re.test(normalized)) {
      throw new Error(`检测到非法 SQL 关键字: ${keyword}`)
    }
  }
  if (!normalized.trim().startsWith('select')) {
    throw new Error('仅允许 SELECT 查询')
  }
}

/** 在数据库连接上设置只读会话，尽最大努力把查询限制为只读 */
export async function setReadOnlySession(conn: { query: (sql: string) => Promise<unknown> }, dbType: 'mysql' | 'postgres'): Promise<void> {
  try {
    if (dbType === 'mysql') {
      // 设置事务只读；需要 SUPER 或用户权限支持
      await conn.query('SET SESSION TRANSACTION READ ONLY')
    }
    if (dbType === 'postgres') {
      await conn.query('SET TRANSACTION READ ONLY')
    }
  } catch {
    // 如果数据库用户没有权限设置会话级只读，则忽略；前置的 SELECT 白名单仍是主要防线
  }
}

export function validateFieldOps(fieldOps: Record<string, FieldOperation>): void {
  for (const field of Object.keys(fieldOps)) {
    if (!validateIdentifier(field)) {
      throw new Error(`非法字段名: ${field}`)
    }
  }
}
