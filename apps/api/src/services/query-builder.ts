import type { FieldOperation, QueryRequest, QueryResponse } from '@well-insight/shared'

const FILTER_RE = /^(>=|<=|!=|[><=])\s*(.+)/
const ALLOWED_FIELDS = /^[a-z_]\w*$/i

function validateIdentifier(name: string): boolean {
  return ALLOWED_FIELDS.test(name)
}

/** 构建 WHERE 子句与参数（支持 > < >= <= = !=） */
export function buildWhere(
  fieldOps: Record<string, FieldOperation>,
  visibleFields: string[],
): { clauses: string[]; params: unknown[] } {
  const clauses: string[] = []
  const params: unknown[] = []

  for (const field of visibleFields) {
    const ops = fieldOps[field]
    if (!ops?.filter) continue
    const match = ops.filter.trim().match(FILTER_RE)
    if (!match || !validateIdentifier(field)) continue
    const [, operator, operand] = match
    const isNum = !Number.isNaN(Number.parseFloat(operand!))
    const param = isNum ? Number.parseFloat(operand!) : operand!.replace(/["']/g, '')
    clauses.push(`\`${field}\` ${operator} ?`)
    params.push(param)
  }

  return { clauses, params }
}

/** 构建 SELECT 列与聚合列 */
export function buildSelect(
  fieldOps: Record<string, FieldOperation>,
  visibleFields: string[],
  fieldTypes: Record<string, 'number' | 'string'>,
): { selectParts: string[]; groupByFields: string[] } {
  const selectParts: string[] = []
  const groupByFields: string[] = []

  for (const field of visibleFields) {
    if (!validateIdentifier(field)) continue
    const ops = fieldOps[field]
    const agg = ops?.agg
    if (agg && agg !== 'none' && fieldTypes[field] === 'number') {
      selectParts.push(`${agg.toUpperCase()}(\`${field}\`) AS \`${field}\``)
    } else {
      selectParts.push(`\`${field}\``)
      groupByFields.push(`\`${field}\``)
    }
  }

  return { selectParts, groupByFields }
}

/** 构建 ORDER BY */
export function buildOrderBy(
  fieldOps: Record<string, FieldOperation>,
  visibleFields: string[],
): { orderBy: string | null; params: unknown[] } {
  for (const field of visibleFields) {
    const ops = fieldOps[field]
    if (ops?.sort && ops.sort !== 'none' && validateIdentifier(field)) {
      return { orderBy: `\`${field}\` ${ops.sort.toUpperCase()}`, params: [] }
    }
  }
  return { orderBy: null, params: [] }
}

export interface QueryPlan {
  sql: string
  params: unknown[]
}

/**
 * 根据 fieldOps 构建参数化 SQL。
 * 安全：表名/字段名均做白名单校验，值全部参数化。
 */
export function buildQuery(
  tableName: string,
  request: QueryRequest,
  fieldTypes: Record<string, 'number' | 'string'>,
): QueryPlan {
  if (!validateIdentifier(tableName)) throw new Error('invalid table name')

  const visibleFields = request.fieldOps
    ? Object.keys(request.fieldOps).filter(f => {
        const ops = request.fieldOps[f]
        return ops && !ops.hidden
      })
    : []

  const { selectParts, groupByFields } = buildSelect(request.fieldOps, visibleFields, fieldTypes)
  if (selectParts.length === 0) throw new Error('no visible fields')

  const { clauses: whereClauses, params: whereParams } = buildWhere(request.fieldOps, visibleFields)
  const { orderBy, params: orderParams } = buildOrderBy(request.fieldOps, visibleFields)

  const hasAggregation = selectParts.some(p => /^(SUM|AVG|COUNT|MIN|MAX)\(/i.test(p))
  const groupBy = hasAggregation && groupByFields.length > 0 ? `GROUP BY ${groupByFields.join(', ')}` : ''

  let sql = `SELECT ${selectParts.join(', ')} FROM \`${tableName}\``
  if (whereClauses.length > 0) sql += ` WHERE ${whereClauses.join(' AND ')}`
  if (groupBy) sql += ` ${groupBy}`
  if (orderBy) sql += ` ORDER BY ${orderBy}`

  return { sql, params: [...whereParams, ...orderParams] }
}

/** 把 SQL 返回的行转换成前端 TableData 结构 */
export function rowsToTableData(
  fields: string[],
  rows: unknown[][],
): QueryResponse {
  return { fields, rows }
}
