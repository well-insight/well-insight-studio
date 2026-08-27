import type { QueryRequest, TableData, Widget } from '@well-insight/shared'
import type {ProcessedData} from './fieldOps';
import { useDataStore } from '../../../stores/dataStore'
import { applyFieldOps  } from './fieldOps'

/**
 * 解析组件渲染数据：
 * - 若已连接后端数据源，优先查询后端接口。
 * - 否则使用本地 applyFieldOps 管道处理。
 */
export async function resolveWidgetDataAsync(widget: Widget, table: TableData): Promise<ProcessedData> {
  const dataStore = useDataStore()
  const { fieldOps, visibleFields } = widget.config
  const validFields = visibleFields.filter(f => table.fields.includes(f))

  if (dataStore.datasourceId && dataStore.schema && !dataStore.schemaError) {
    const request: QueryRequest = {
      table: widget.dataSource,
      fieldOps: Object.fromEntries(
        table.fields.map(f => {
          const ops = fieldOps[f]
          return [f, ops ?? { alias: f, agg: 'none', sort: 'none', filter: '', hidden: !validFields.includes(f) }]
        }),
      ),
    }
    const response = await dataStore.query(widget.dataSource, request)
    return {
      fields: response.fields,
        displayFields: response.fields.map((f: string) => fieldOps[f]?.alias || f),
      rows: response.rows,
    }
  }

  if (validFields.length > 0 && Object.keys(fieldOps).length > 0) {
    return applyFieldOps(table, fieldOps, validFields)
  }

  return {
    fields: table.fields,
    displayFields: table.fields,
    rows: table.rows.map(r => [...r]),
  }
}

/**
 * 同步版本：后端查询时返回上一次缓存结果，避免组件渲染阻塞。
 * 组件挂载后应调用 refreshWidgetData 触发真实查询。
 */
export function resolveWidgetData(widget: Widget, table: TableData): ProcessedData {
  const dataStore = useDataStore()
  const { fieldOps, visibleFields } = widget.config
  const validFields = visibleFields.filter(f => table.fields.includes(f))

  if (dataStore.datasourceId && dataStore.schema && !dataStore.schemaError) {
    const cached = dataStore.queryCache.get(`${dataStore.datasourceId}:${widget.dataSource}:${JSON.stringify(fieldOps)}`)
    if (cached) {
      return {
        fields: cached.fields,
        displayFields: cached.fields.map((f: string) => fieldOps[f]?.alias || f),
        rows: cached.rows,
      }
    }
  }

  if (validFields.length > 0 && Object.keys(fieldOps).length > 0) {
    return applyFieldOps(table, fieldOps, validFields)
  }

  return {
    fields: table.fields,
    displayFields: table.fields,
    rows: table.rows.map(r => [...r]),
  }
}
