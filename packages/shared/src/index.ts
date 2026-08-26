export interface HealthResponse {
  status: 'ok'
  service: string
}

// ================================================================
//  Well-Insight Studio · 可视化画布共享类型
//  前后端共用：前端画布渲染 / 后端 ProjectConfig 持久化与查询
// ================================================================

/** 字段聚合方式 */
export type FieldAgg = 'none' | 'sum' | 'avg' | 'count' | 'min' | 'max'

/** 字段排序方向 */
export type FieldSort = 'none' | 'asc' | 'desc'

/** 单个字段的操作配置 */
export interface FieldOperation {
  /** 显示别名（空串表示使用原字段名） */
  alias: string
  agg: FieldAgg
  sort: FieldSort
  /** 过滤表达式，如 "> 1000"、'= "Electronics"'；空串表示不过滤 */
  filter: string
  hidden: boolean
}

/** 画布组件类型 */
export type WidgetType = 'kpi' | 'bar' | 'line' | 'pie' | 'table'

/** 画布组件（小部件） */
export interface Widget {
  /** UUID */
  id: string
  type: WidgetType
  title: string
  /** 数据源（表）名称 */
  dataSource: string
  x: number
  y: number
  width: number
  height: number
  /** 主题色（十六进制） */
  color: string
  visible: boolean
  locked: boolean
  config: {
    /** 字段名 → 字段操作 */
    fieldOps: Record<string, FieldOperation>
    /** 参与渲染的可见字段（有序） */
    visibleFields: string[]
  }
}

/** 项目画布配置（projects.config JSON 字段的顶层结构） */
export interface ProjectConfig {
  version: 1
  widgets: Widget[]
  canvas: {
    zoom: number
  }
}

/** 表数据结构（schema + 行数据） */
export interface TableData {
  fields: string[]
  rows: unknown[][]
}

/** 数据源 schema 响应 */
export interface DatasourceSchema {
  tables: Record<string, { fields: { name: string; type: 'number' | 'string' }[] }>
}

/** 查询请求体 */
export interface QueryRequest {
  table: string
  fieldOps: Record<string, FieldOperation>
}

/** 查询响应 */
export interface QueryResponse {
  fields: string[]
  rows: unknown[][]
}
