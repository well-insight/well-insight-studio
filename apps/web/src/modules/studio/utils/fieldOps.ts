import type { FieldOperation, TableData } from '@well-insight/shared'

export interface ProcessedData {
  /** 参与渲染的字段（有序） */
  fields: string[]
  /** 显示名（别名优先） */
  displayFields: string[]
  /** 处理后的行，与 fields 顺序对齐 */
  rows: unknown[][]
}

const FILTER_RE = /^(>=|<=|!=|[><=])\s*(.+)/

type Row = unknown[]

function matchFilter(cell: unknown, operator: string, operand: string): boolean {
  const numeric = !Number.isNaN(Number.parseFloat(operand))
  if (numeric) {
    const numCell = Number.parseFloat(String(cell))
    if (Number.isNaN(numCell)) return false
    const numVal = Number.parseFloat(operand)
    switch (operator) {
      case '>': return numCell > numVal
      case '<': return numCell < numVal
      case '>=': return numCell >= numVal
      case '<=': return numCell <= numVal
      case '=': return numCell === numVal
      case '!=': return numCell !== numVal
      default: return true
    }
  }
  const strCell = String(cell)
  const strVal = operand.replace(/["']/g, '')
  if (operator === '=') return strCell === strVal
  if (operator === '!=') return strCell !== strVal
  return true
}

function aggregate(vals: number[], agg: FieldOperation['agg']): number {
  switch (agg) {
    case 'sum': return vals.reduce((a, b) => a + b, 0)
    case 'avg': return vals.reduce((a, b) => a + b, 0) / (vals.length || 1)
    case 'count': return vals.length
    case 'min': return Math.min(...vals)
    case 'max': return Math.max(...vals)
    default: return vals[0] ?? 0
  }
}

/**
 * 数据处理管道：过滤 → 排序 → 聚合分组 → 投影到可见字段。
 * 画布渲染与配置预览共用；P4 后端 Query Builder 以本函数行为为基准。
 */
export function applyFieldOps(
  data: TableData,
  fieldOps: Record<string, FieldOperation>,
  visibleFields: string[],
): ProcessedData {
  const { fields } = data
  const isNumField = (f: string) =>
    data.rows.length > 0 && typeof data.rows[0]?.[fields.indexOf(f)] === 'number'

  let rows: Row[] = data.rows.map(r => [...r])

  // 1) 过滤
  for (const f of visibleFields) {
    const ops = fieldOps[f]
    if (!ops?.filter) continue
    const idx = fields.indexOf(f)
    const match = ops.filter.trim().match(FILTER_RE)
    if (!match || idx < 0) continue
    const [, operator, operand] = match
    rows = rows.filter(row => matchFilter(row[idx], operator!, operand!))
  }

  // 2) 排序（第一个设置了排序的字段生效）
  let sortField: string | null = null
  let sortDir: 'asc' | 'desc' | 'none' = 'none'
  for (const f of visibleFields) {
    const ops = fieldOps[f]
    if (ops && ops.sort !== 'none' && (!sortField || ops.sort === 'asc')) {
      sortField = f
      sortDir = ops.sort
    }
  }
  if (sortField && sortDir !== 'none') {
    const idx = fields.indexOf(sortField)
    const dir = sortDir === 'asc' ? 1 : -1
    rows.sort((a, b) => {
      const va = a[idx]
      const vb = b[idx]
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
      return String(va).localeCompare(String(vb)) * dir
    })
  }

  // 3) 聚合分组
  const aggFields = visibleFields.filter(f => {
    const ops = fieldOps[f]
    return ops && ops.agg !== 'none' && isNumField(f)
  })

  const projectRow = (sourceRows: Row[]): Row =>
    visibleFields.map(f => {
      const idx = fields.indexOf(f)
      const ops = fieldOps[f]
      if (aggFields.includes(f) && ops) {
        const vals = sourceRows
          .map(r => Number.parseFloat(String(r[idx])))
          .filter(v => !Number.isNaN(v))
        return Math.round(aggregate(vals, ops.agg) * 100) / 100
      }
      return sourceRows[0]?.[idx] ?? ''
    })

  if (aggFields.length > 0 && rows.length > 0) {
    const groupFields = visibleFields.filter(f => !aggFields.includes(f))
    if (groupFields.length > 0) {
      const groups = new Map<string, Row[]>()
      for (const row of rows) {
        const key = groupFields.map(f => String(row[fields.indexOf(f)])).join('|')
        const bucket = groups.get(key)
        if (bucket) bucket.push(row)
        else groups.set(key, [row])
      }
      rows = [...groups.values()].map(projectRow)
    } else {
      rows = [projectRow(rows)]
    }
  } else {
    rows = rows.map(row => visibleFields.map(f => row[fields.indexOf(f)]))
  }

  const displayFields = visibleFields.map(f => fieldOps[f]?.alias || f)
  return { fields: visibleFields, displayFields, rows }
}
