import type { ApiResponse } from '@/utils/request/alovaConfig'
import { request } from '@/utils'
import { axiosInstance } from '@/utils/request/alovaConfig'

// ─── 类型定义 ───────────────────────────────────────────────
export type ConnectorFieldType = 'text' | 'number' | 'datetime'

/** parse-file 返回的原始矩阵信息 */
export interface ParseFileResult {
  sessionId: string
  totalRows: number
  /** 前 50 行原始数据（每行为 unknown[]），供表头选择和预览使用 */
  previewMatrix: unknown[][]
  colCount: number
}

/** 单个字段的配置（使用 colIndex 而非 header 字符串定位列） */
export interface ConnectorFieldConfig {
  /** 0-based 列索引 */
  colIndex: number
  /** 所选表头行对应列的原始值（用于显示） */
  header: string
  /** 用户定义的数据集字段名 */
  name: string
  type: ConnectorFieldType
  include: boolean
}

export interface ImportResult {
  id: string
  name: string
  row_count: number
  field_count: number
}

// ─── API 函数 ────────────────────────────────────────────────

/** 上传并解析 Excel/CSV，返回原始矩阵 */
export async function parseFile(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<ParseFileResult> {
  const formData = new FormData()
  formData.append('file', file)
  const response = (await axiosInstance.post('/connector/parse-file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e: any) => {
      if (e.total && onProgress)
        onProgress(Math.round((e.loaded / e.total) * 100))
    },
  })) as ApiResponse<ParseFileResult>
  return response.data as ParseFileResult
}

/** 确认导入：传入 headerRowIndex + 字段配置 + 数据集信息 */
export function importDataset(body: {
  sessionId: string
  headerRowIndex: number
  fields: ConnectorFieldConfig[]
  dataset: {
    name: string
    description?: string | null
    folder_id?: string | null
    project_id?: string | null
  }
}) {
  return request.post<ImportResult>('/connector/import', body)
}
