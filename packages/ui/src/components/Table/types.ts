import type { WdSizeInput } from '../../shared/types'

export type TableSize = WdSizeInput

export interface TableColumn<Row extends Record<string, unknown> = Record<string, unknown>> {
  key: keyof Row & string
  label: string
  align?: 'start' | 'center' | 'end'
}

export interface TableProps {
  columns: TableColumn[]
  rows: Record<string, unknown>[]
  rowKey?: string
  emptyText?: string
  size?: TableSize
}
