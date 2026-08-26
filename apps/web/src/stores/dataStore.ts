import { defineStore } from 'pinia'
import type { DatasourceSchema, QueryRequest, QueryResponse, TableData } from '@well-insight/shared'
import { fetchDatasourceSchema, queryDatasource, schemaToTables } from '../api/datasources'
import { sampleTables } from '../modules/studio/utils/sampleData'

interface DataStoreState {
  /** 当前数据源 ID，为空时使用内置样例数据 */
  datasourceId: string | null
  /** 后端 schema 缓存 */
  schema: DatasourceSchema | null
  /** 合并后的表数据：schema 字段 + 可选的本地/缓存行数据 */
  tables: Record<string, TableData>
  /** 查询缓存：key = `${datasourceId}:${table}:${hash}`，临时存储避免重复请求 */
  queryCache: Map<string, QueryResponse>
  isLoadingSchema: boolean
  schemaError: string | null
}

function cacheKey(datasourceId: string | null, table: string, request: QueryRequest): string {
  return `${datasourceId ?? 'local'}:${table}:${JSON.stringify(request.fieldOps)}`
}

/**
 * 数据源 store。
 * P4 接入真实 API：先通过 datasourceId 加载 schema，query 时走后端 query 接口。
 * 未指定 datasourceId 时退回到内置样例数据。
 */
export const useDataStore = defineStore('data', {
  state: (): DataStoreState => ({
    datasourceId: null,
    schema: null,
    tables: sampleTables,
    queryCache: new Map(),
    isLoadingSchema: false,
    schemaError: null,
  }),

  getters: {
    tableNames: state => Object.keys(state.tables),

    isRemote(): boolean {
      return !!this.datasourceId
    },
  },

  actions: {
    getTable(name: string): TableData {
      return this.tables[name] ?? { fields: [], rows: [] }
    },

    /** 切换数据源并加载 schema */
    async loadDatasource(id: string | null) {
      this.datasourceId = id
      this.schemaError = null
      if (!id) {
        this.schema = null
        this.tables = sampleTables
        return
      }

      this.isLoadingSchema = true
      try {
        const schema = await fetchDatasourceSchema(id)
        this.schema = schema
        this.tables = schemaToTables(schema)
      } catch (err) {
        this.schemaError = err instanceof Error ? err.message : String(err)
        // 外部数据源失败时禁止回退到样例数据，避免展示错误数据
        this.tables = {}
      } finally {
        this.isLoadingSchema = false
      }
    },

    /** 查询后端数据源，返回 QueryResponse。本地模式时直接返回本地表数据。 */
    async query(table: string, request: QueryRequest): Promise<QueryResponse> {
      const key = cacheKey(this.datasourceId, table, request)
      if (this.queryCache.has(key)) return this.queryCache.get(key)!

      if (!this.datasourceId || this.schemaError) {
        const local = this.getTable(table)
        const result: QueryResponse = { fields: local.fields, rows: local.rows }
        this.queryCache.set(key, result)
        return result
      }

      const result = await queryDatasource(this.datasourceId, request)
      this.queryCache.set(key, result)
      return result
    },

    clearCache() {
      this.queryCache.clear()
    },
  },
})
