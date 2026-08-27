import type { DatasourceSchema, FieldOperation, QueryRequest, QueryResponse } from '@well-insight/shared'
import mysql from 'mysql2/promise'
import pg from 'pg'
import { buildQuery } from './query-builder'
import { assertSelectOnly, setReadOnlySession, validateFieldOps, validateTableName } from './sql-guard'

type ConnectionPool = mysql.Pool | pg.Pool

const mysqlPools = new Map<string, mysql.Pool>()
const pgPools = new Map<string, pg.Pool>()

export function getMySQLPool(connectionString: string): mysql.Pool {
  if (!mysqlPools.has(connectionString)) {
    const pool = mysql.createPool({
      uri: connectionString,
      connectionLimit: 5,
      waitForConnections: true,
      enableKeepAlive: true,
    })
    mysqlPools.set(connectionString, pool)
  }
  return mysqlPools.get(connectionString)!
}

export function getPostgresPool(connectionString: string): pg.Pool {
  if (!pgPools.has(connectionString)) {
    const pool = new pg.Pool({ connectionString })
    pgPools.set(connectionString, pool)
  }
  return pgPools.get(connectionString)!
}

export async function closeConnectionPool(connectionString: string, type?: 'mysql' | 'postgres') {
  const mysqlPool = mysqlPools.get(connectionString)
  if (mysqlPool) {
    await mysqlPool.end()
    mysqlPools.delete(connectionString)
  }
  const pgPool = pgPools.get(connectionString)
  if (pgPool) {
    await pgPool.end()
    pgPools.delete(connectionString)
  }
}

export async function closeAllPools() {
  await Promise.all([...mysqlPools.values()].map(p => p.end()))
  mysqlPools.clear()
  await Promise.all([...pgPools.values()].map(p => p.end()))
  pgPools.clear()
}

export interface TestConnectionResult {
  ok: boolean
  message?: string
}

export async function testConnection(type: 'mysql' | 'postgres', connectionString: string): Promise<TestConnectionResult> {
  try {
    if (type === 'mysql') {
      const pool = getMySQLPool(connectionString)
      const conn = await pool.getConnection()
      try {
        await setReadOnlySession(conn, 'mysql')
        await conn.query('SELECT 1')
        return { ok: true }
      } finally {
        conn.release()
      }
    }
    if (type === 'postgres') {
      const pool = getPostgresPool(connectionString)
      const client = await pool.connect()
      try {
        await setReadOnlySession(client, 'postgres')
        await client.query('SELECT 1')
        return { ok: true }
      } finally {
        client.release()
      }
    }
    return { ok: false, message: `unsupported type: ${type}` }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) }
  }
}

/** 根据连接串前缀解析数据库类型；如果与 type 冲突，以 type 为准 */
function detectDbType(connectionString: string, type: 'mysql' | 'postgres'): 'mysql' | 'postgres' {
  const lower = connectionString.toLowerCase()
  if (lower.startsWith('postgres://') || lower.startsWith('postgresql://')) return 'postgres'
  if (lower.startsWith('mysql://')) return 'mysql'
  return type
}

/** 从数据库查询字段类型 */
export async function introspectSchema(
  type: 'mysql' | 'postgres',
  connectionString: string,
): Promise<DatasourceSchema['tables']> {
  const dbType = detectDbType(connectionString, type)
  if (dbType === 'postgres') {
    return introspectPostgresSchema(connectionString)
  }
  return introspectMySQLSchema(connectionString)
}

async function introspectMySQLSchema(connectionString: string): Promise<DatasourceSchema['tables']> {
  const pool = getMySQLPool(connectionString)
  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    `SELECT table_name, column_name, data_type
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
     ORDER BY table_name, ordinal_position`,
  )

  const tables: DatasourceSchema['tables'] = {}
  for (const row of rows) {
    const table = tables[row.table_name] ?? { fields: [] }
    table.fields.push({
      name: row.column_name,
      type: mysqlTypeToFieldType(row.data_type),
    })
    tables[row.table_name] = table
  }
  return tables
}

async function introspectPostgresSchema(connectionString: string): Promise<DatasourceSchema['tables']> {
  const pool = getPostgresPool(connectionString)
  const result = await pool.query<{
    table_name: string
    column_name: string
    data_type: string
  }>(
    `SELECT table_name, column_name, data_type
     FROM information_schema.columns
     WHERE table_schema = 'public'
     ORDER BY table_name, ordinal_position`,
  )

  const tables: DatasourceSchema['tables'] = {}
  for (const row of result.rows) {
    const table = tables[row.table_name] ?? { fields: [] }
    table.fields.push({
      name: row.column_name,
      type: postgresTypeToFieldType(row.data_type),
    })
    tables[row.table_name] = table
  }
  return tables
}

function mysqlTypeToFieldType(dataType: string): 'number' | 'string' {
  const numericTypes = new Set([
    'tinyint', 'smallint', 'mediumint', 'int', 'integer', 'bigint',
    'float', 'double', 'decimal', 'numeric',
  ])
  return numericTypes.has(dataType.toLowerCase().split('(')[0]!) ? 'number' : 'string'
}

function postgresTypeToFieldType(dataType: string): 'number' | 'string' {
  const numericTypes = new Set([
    'smallint', 'integer', 'bigint', 'serial', 'bigserial',
    'real', 'double precision', 'numeric', 'decimal',
  ])
  return numericTypes.has(dataType.toLowerCase()) ? 'number' : 'string'
}

/**
 * 在外部数据库上执行 query builder 生成的参数化 SQL。
 * 安全：connectionString 仅用于创建 pool；字段名 / 表名已白名单校验；值全部参数化。
 */
export async function executeExternalQuery(
  type: 'mysql' | 'postgres',
  connectionString: string,
  request: QueryRequest,
  fieldTypes: Record<string, 'number' | 'string'>,
): Promise<QueryResponse> {
  validateFieldOps(request.fieldOps)
  if (!validateTableName(request.table)) {
    throw new Error('invalid table name')
  }

  const dbType = detectDbType(connectionString, type)
  if (dbType === 'postgres') {
    return executePostgresQuery(connectionString, request, fieldTypes)
  }
  return executeMySQLQuery(connectionString, request, fieldTypes)
}

async function executeMySQLQuery(
  connectionString: string,
  request: QueryRequest,
  fieldTypes: Record<string, 'number' | 'string'>,
): Promise<QueryResponse> {
  const plan = buildQuery(request.table, request, fieldTypes)
  assertSelectOnly(plan.sql)

  const pool = getMySQLPool(connectionString)
  const conn = await pool.getConnection()
  try {
    await setReadOnlySession(conn, 'mysql')
    const [rows] = await conn.query<mysql.RowDataPacket[]>(plan.sql, plan.params)

    if (!rows.length) {
      return { fields: [], rows: [] }
    }

    const fields = Object.keys(rows[0]!)
    return {
      fields,
      rows: rows.map(r => fields.map(f => r[f])),
    }
  } finally {
    conn.release()
  }
}

async function executePostgresQuery(
  connectionString: string,
  request: QueryRequest,
  fieldTypes: Record<string, 'number' | 'string'>,
): Promise<QueryResponse> {
  const plan = buildQuery(request.table, request, fieldTypes)
  assertSelectOnly(plan.sql)
  // Postgres 参数占位符为 $1, $2... 需要把 ? 替换
  const pgSql = plan.sql.replace(/\?/g, (_, index) => `$${index + 1}`)

  const pool = getPostgresPool(connectionString)
  const client = await pool.connect()
  try {
    await setReadOnlySession(client, 'postgres')
    const result = await client.query<Record<string, unknown>>(pgSql, plan.params)

    if (!result.rows.length) {
      return { fields: [], rows: [] }
    }

    const fields = Object.keys(result.rows[0]!)
    return {
      fields,
      rows: result.rows.map(r => fields.map(f => r[f])),
    }
  } finally {
    client.release()
  }
}

/** CSV 内存解析：从字符串内容解析成行 */
export function parseCSV(content: string): string[][] {
  const lines: string[][] = []
  const len = content.length
  let i = 0
  while (i < len) {
    const row: string[] = []
    let cell = ''
    let inQuote = false
    while (i < len) {
      const ch = content[i]!
      if (inQuote) {
        if (ch === '"') {
          if (content[i + 1] === '"') {
            cell += '"'
            i += 2
            continue
          }
          inQuote = false
          i++
          continue
        }
        cell += ch
        i++
        continue
      }
      if (ch === '"') {
        inQuote = true
        i++
        continue
      }
      if (ch === ',') {
        row.push(cell)
        cell = ''
        i++
        continue
      }
      if (ch === '\r') {
        i++
        continue
      }
      if (ch === '\n') {
        row.push(cell)
        cell = ''
        lines.push(row)
        i++
        break
      }
      cell += ch
      i++
    }
    if (i >= len && (cell !== '' || row.length > 0)) {
      row.push(cell)
      lines.push(row)
    }
  }
  return lines
}

/** 推断 CSV 字段类型：按首行数据是否为数字判断 */
function inferCSVFieldTypes(rows: string[][], fields: string[]): Record<string, 'number' | 'string'> {
  const types: Record<string, 'number' | 'string'> = {}
  for (let i = 0; i < fields.length; i++) {
    const sample = rows[0]?.[i]
    types[fields[i]!] = sample !== undefined && !Number.isNaN(Number.parseFloat(sample)) && String(Number.parseFloat(sample)) === sample.trim() ? 'number' : 'string'
  }
  return types
}

/** 执行 CSV 查询：将 CSV 内容视为单表数据源，应用 fieldOps */
export function executeCSVQuery(
  content: string,
  request: QueryRequest,
): QueryResponse {
  validateFieldOps(request.fieldOps)
  if (!validateTableName(request.table)) {
    throw new Error('invalid table name')
  }

  const allLines = parseCSV(content.trim())
  if (allLines.length < 2) return { fields: [], rows: [] }

  const headers = allLines[0]!
  const dataRows = allLines.slice(1).filter(r => r.some(c => c.trim() !== ''))
  const fieldTypes = inferCSVFieldTypes(dataRows, headers)

  // 构造一个内部 schema 表示，使 fieldOps 可用
  const schemaFields = headers.map(name => ({ name, type: fieldTypes[name] ?? 'string' as const }))
  const internalRows = dataRows.map(r => Object.fromEntries(r.map((cell, i) => [headers[i], cell])))

  const table: { fields: typeof schemaFields; rows: Record<string, string>[] } = {
    fields: schemaFields,
    rows: internalRows,
  }

  const fieldOps = request.fieldOps
  const visibleFields = table.fields
    .map(f => f.name)
    .filter(f => {
      const ops = fieldOps[f]
      return ops && !ops.hidden
    })

  if (visibleFields.length === 0) return { fields: [], rows: [] }

  const parseFilter = (ops: FieldOperation) => {
    const match = ops.filter.trim().match(/^(>=|<=|!=|[><=])\s*(.+)/)
    if (!match) return null
    return { operator: match[1]!, operand: match[2]!.replace(/["']/g, '') }
  }

  let rows = table.rows.filter(row => {
    for (const f of visibleFields) {
      const ops = fieldOps[f]
      if (!ops?.filter) continue
      const parsed = parseFilter(ops)
      if (!parsed) continue
      const { operator, operand } = parsed
      const raw = row[f] ?? ''
      const value = Number.parseFloat(raw)
      const isNum = !Number.isNaN(value) && operand !== '' && !Number.isNaN(Number.parseFloat(operand))
      if (isNum) {
        const opValue = Number.parseFloat(operand)
        if (operator === '>' && !(value > opValue)) return false
        if (operator === '<' && !(value < opValue)) return false
        if (operator === '>=' && !(value >= opValue)) return false
        if (operator === '<=' && !(value <= opValue)) return false
        if (operator === '=' && value !== opValue) return false
        if (operator === '!=' && value === opValue) return false
      } else {
        const str = raw.trim()
        if (operator === '=' && str !== operand) return false
        if (operator === '!=' && str === operand) return false
      }
    }
    return true
  })

  for (const f of visibleFields) {
    const ops = fieldOps[f]
    if (ops?.sort && ops.sort !== 'none') {
      const dir = ops.sort === 'asc' ? 1 : -1
      const idx = table.fields.findIndex(tf => tf.name === f)
      const type = table.fields[idx]?.type ?? 'string'
      rows.sort((a, b) => {
        const va = a[f] ?? ''; const vb = b[f] ?? ''
        if (type === 'number') {
          const na = Number.parseFloat(va); const nb = Number.parseFloat(vb)
          return (na - nb) * dir
        }
        return va.localeCompare(vb) * dir
      })
      break
    }
  }

  const aggFields = visibleFields.filter(f => {
    const ops = fieldOps[f]
    const type = table.fields.find(tf => tf.name === f)?.type
    return ops && ops.agg !== 'none' && type === 'number'
  })

  const groupFields = visibleFields.filter(f => !aggFields.includes(f))

  const aggregate = (vals: number[], agg: string): number => {
    switch (agg) {
      case 'sum': return vals.reduce((a, b) => a + b, 0)
      case 'avg': return vals.reduce((a, b) => a + b, 0) / (vals.length || 1)
      case 'count': return vals.length
      case 'min': return Math.min(...vals)
      case 'max': return Math.max(...vals)
      default: return vals[0] ?? 0
    }
  }

  const toNumber = (v: string) => {
    const n = Number.parseFloat(v)
    return Number.isNaN(n) ? 0 : n
  }

  if (aggFields.length > 0 && rows.length > 0) {
    if (groupFields.length > 0) {
      const groups = new Map<string, typeof rows>()
      for (const row of rows) {
        const key = groupFields.map(f => row[f]).join('|')
        if (!groups.has(key)) groups.set(key, [row])
        else groups.get(key)!.push(row)
      }
      rows = [...groups.values()].map(group => {
        const out: Record<string, string> = {}
        for (const f of visibleFields) {
          if (aggFields.includes(f)) {
            const vals = group.map(r => toNumber(r[f] ?? ''))
            out[f] = String(Math.round(aggregate(vals, fieldOps[f]!.agg) * 100) / 100)
          } else {
            out[f] = group[0]![f] ?? ''
          }
        }
        return out
      })
    } else {
      const out: Record<string, string> = {}
      for (const f of visibleFields) {
        if (aggFields.includes(f)) {
          const vals = rows.map(r => toNumber(r[f] ?? ''))
          out[f] = String(Math.round(aggregate(vals, fieldOps[f]!.agg) * 100) / 100)
        } else {
          out[f] = rows[0]![f] ?? ''
        }
      }
      rows = [out]
    }
  }

  return {
    fields: visibleFields,
    rows: rows.map(r => visibleFields.map(f => r[f])),
  }
}
