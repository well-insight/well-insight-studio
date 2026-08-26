import { defineStore } from 'pinia'
import type { FieldOperation, Widget } from '@well-insight/shared'
import { computed, ref } from 'vue'
import { useDataStore } from './dataStore'
import { isNumericField } from '../modules/studio/utils/sampleData'

export interface ConfigFormState {
  targetId: string | null
  dataSource: string
  fieldOps: Record<string, FieldOperation>
  selectedFields: string[]
}

export const useConfigStore = defineStore('config', () => {
  const dataStore = useDataStore()

  const targetId = ref<string | null>(null)
  const dataSource = ref<string>('orders')
  const fieldOps = ref<Record<string, FieldOperation>>({})
  const selectedFields = ref<string[]>([])

  const isOpen = computed(() => targetId.value !== null)
  const currentWidget = computed<Widget | null>(() => null) // 由调用方传入，store 只管理弹窗状态
  const tableData = computed(() => dataStore.getTable(dataSource.value))
  const fields = computed(() => tableData.value.fields)
  const allNumeric = computed(() =>
    selectedFields.value.length > 0 &&
    selectedFields.value.every(f => isNumericField(tableData.value, f)),
  )

  function defaultOpsFor(field: string): FieldOperation {
    return {
      alias: field,
      agg: isNumericField(tableData.value, field) ? 'sum' : 'none',
      sort: 'none',
      filter: '',
      hidden: false,
    }
  }

  function open(widget: Widget) {
    targetId.value = widget.id
    dataSource.value = widget.dataSource
    selectedFields.value = [...widget.config.visibleFields]

    const nextOps: Record<string, FieldOperation> = {}
    for (const field of tableData.value.fields) {
      const ops = widget.config.fieldOps[field]
      nextOps[field] = ops
        ? { ...ops }
        : defaultOpsFor(field)
    }
    fieldOps.value = nextOps
  }

  function close() {
    targetId.value = null
    dataSource.value = 'orders'
    fieldOps.value = {}
    selectedFields.value = []
  }

  function toggleField(field: string) {
    const idx = selectedFields.value.indexOf(field)
    if (idx === -1) selectedFields.value.push(field)
    else selectedFields.value.splice(idx, 1)
  }

  function selectAll() {
    selectedFields.value = [...fields.value]
  }

  function deselectAll() {
    selectedFields.value = []
  }

  function setAlias(value: string) {
    for (const f of selectedFields.value) fieldOps.value[f]!.alias = value
  }

  function setAgg(value: FieldOperation['agg']) {
    for (const f of selectedFields.value) {
      if (isNumericField(tableData.value, f)) fieldOps.value[f]!.agg = value
    }
  }

  function setSort(value: FieldOperation['sort']) {
    for (const f of selectedFields.value) fieldOps.value[f]!.sort = value
  }

  function setFilter(value: string) {
    for (const f of selectedFields.value) fieldOps.value[f]!.filter = value
  }

  function setHidden(hidden: boolean) {
    for (const f of selectedFields.value) fieldOps.value[f]!.hidden = hidden
  }

  return {
    targetId,
    dataSource,
    fieldOps,
    selectedFields,
    isOpen,
    tableData,
    fields,
    allNumeric,
    open,
    close,
    toggleField,
    selectAll,
    deselectAll,
    setAlias,
    setAgg,
    setSort,
    setFilter,
    setHidden,
  }
})
