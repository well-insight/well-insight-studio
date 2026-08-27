import type { DatasourceSchema, QueryRequest, QueryResponse, TableData } from '@well-insight/shared'
import { defineStore } from 'pinia'
import { fetchDatasourceSchema, queryDatasource, schemaToTables } from '../../api/datasources'

interface DataStoreState {
  /** 当前数据源 ID；未选择数据源时为空 */
  datasourceId: string | null
  /** 后端 schema 缓存 */
  schema: DatasourceSchema | null
  /** 当前数据源的表结构；真实行数据通过查询接口加载 */
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
 * 未指定 datasourceId 时保持空数据，避免展示虚构的业务数据。
 */
export const useDataStore = defineStore('data', {
  state: (): DataStoreState => ({
    datasourceId: null,
    schema: null,
    tables: {},
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
        this.tables = {}
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

    /** 查询后端真实数据源，返回 QueryResponse。未连接时返回空结果。 */
    async query(table: string, request: QueryRequest): Promise<QueryResponse> {
      const key = cacheKey(this.datasourceId, table, request)
      if (this.queryCache.has(key)) return this.queryCache.get(key)!

      if (!this.datasourceId || this.schemaError) {
        const result: QueryResponse = { fields: [], rows: [] }
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
