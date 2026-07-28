<script setup lang="ts">
import type { ColumnDefine, ListTableConstructorOptions } from '@visactor/vtable'
import type { ApiDatasetDetail, ApiDatasetField } from '@/api/dataset'
import type { FormField, FormSchema } from '@/form-designer/types'
import dayjs from 'dayjs'
import { ElButton, ElMessage, ElMessageBox } from 'element-plus'
import { h, reactive, ref, watch } from 'vue'
import {
  createDatasetRow,
  deleteDatasetRow,
  fetchDatasetDetail,
  fetchDatasetRowsPage,
  updateDatasetRow,
} from '@/api/dataset'
import { AdaptiveDialog } from '@/components/adaptive-dialog'
import ColumnField from '@/components/column-field/ColumnField.vue'
import ElListTable from '@/components/el-vtable/ElListTable.vue'
import { FormRenderer } from '@/form-designer'
import { createFormField, getEmptyFormSchema, isValidFormSchema, normalizeFormSchema } from '@/form-designer/form-designer.utils'

import { vueGroupCustomLayout } from '@/utils/vtableVueCustomLayout'

const props = withDefaults(
  defineProps<{
    datasetId: string | null
    /** 为 true 时展示新增/编辑/删除行（用于「编辑数据集」对话框） */
    editable?: boolean
  }>(),
  {
    datasetId: null,
    editable: false,
  },
)

const emit = defineEmits<{
  rowsUpdated: []
  /** 可新增行状态（字段已加载且非空），供标题栏按钮使用 */
  addRowStateChange: [payload: { canAdd: boolean }]
}>()

const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const fields = ref<ApiDatasetField[]>([])

const tableOptions = reactive<ListTableConstructorOptions>({
  columns: [],
  records: [],
  widthMode: 'autoWidth',
})

const rowDialogVisible = ref(false)
const rowDialogMode = ref<'create' | 'edit'>('create')
const editingRowId = ref<string | null>(null)
const rowForm = ref<Record<string, unknown>>({})
const rowFormSchema = ref<FormSchema | null>(null)
const rowRendererRef = ref<InstanceType<typeof FormRenderer> | null>(null)
const rowSubmitting = ref(false)

function componentForFieldType(type: ApiDatasetField['field_type']) {
  if (type === 'number')
    return 'number'
  if (type === 'datetime')
    return 'datePicker'
  return 'input'
}

function createFallbackFormField(field: ApiDatasetField, index: number): FormField {
  return createFormField(componentForFieldType(field.field_type), {
    _vid: `dataset_${field.id}`,
    field: field.id,
    label: field.name,
    placeholder: field.field_type === 'number' ? '请输入数字' : field.field_type === 'datetime' ? '请选择日期' : '请输入',
    colSpan: 12,
    sort: index,
  })
}

function createRowFormSchema(dataset: ApiDatasetDetail): FormSchema {
  const sourceFields = [...dataset.fields].sort((a, b) => a.sort_order - b.sort_order)
  const baseSchema = isValidFormSchema(dataset.form_schema)
    ? normalizeFormSchema(dataset.form_schema as FormSchema)
    : getEmptyFormSchema()
  const usedFieldIds = new Set<string>()
  const mappedFields = baseSchema.fields.flatMap((field, index) => {
    const sourceField = sourceFields.find(item => item.id === field.field && !usedFieldIds.has(item.id))
      ?? sourceFields[index]
    if (!sourceField || usedFieldIds.has(sourceField.id))
      return []
    usedFieldIds.add(sourceField.id)
    return [{
      ...field,
      field: sourceField.id,
      label: field.label || sourceField.name,
      sort: index,
    }]
  })
  const missingFields = sourceFields
    .filter(field => !usedFieldIds.has(field.id))
    .map((field, index) => createFallbackFormField(field, mappedFields.length + index))
  return {
    ...baseSchema,
    config: {
      ...baseSchema.config,
      submitBtn: { ...baseSchema.config.submitBtn, show: false },
      resetBtn: { ...baseSchema.config.resetBtn, show: false },
    },
    fields: [...mappedFields, ...missingFields],
  }
}

function normalizeRendererValue(field: ApiDatasetField, value: unknown): string | number | null {
  if (value === undefined || value === null || value === '')
    return null
  if (field.field_type === 'number') {
    const numberValue = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(numberValue))
      throw new Error(`「${field.name}」须为有效数字`)
    return numberValue
  }
  if (field.field_type === 'datetime') {
    if (typeof value === 'string' && !Number.isNaN(Date.parse(value)))
      return value
    const parsed = dayjs(value as string | number | Date)
    if (!parsed.isValid())
      throw new Error(`「${field.name}」须为有效日期`)
    return parsed.format('YYYY-MM-DD HH:mm:ss')
  }
  return typeof value === 'string' ? value : JSON.stringify(value)
}

function restoreRendererValue(field: FormField | undefined, value: unknown): unknown {
  if (typeof value !== 'string' || !field)
    return value
  if (['checkbox', 'cascader', 'transfer'].includes(field.componentKey)) {
    try {
      return JSON.parse(value)
    }
    catch {
      return value
    }
  }
  if (field.componentKey === 'switch')
    return value === 'true' ? true : value === 'false' ? false : value
  const option = field.options?.find(item => String(item.value) === value)
  if (option)
    return option.value
  if (['number', 'rate', 'slider'].includes(field.componentKey)) {
    const numberValue = Number(value)
    return Number.isFinite(numberValue) ? numberValue : value
  }
  return value
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined)
    return ''
  if (typeof v === 'number')
    return Number.isFinite(v) ? String(v) : ''
  return String(v)
}

function syncTableFrozen(editable: boolean) {
  tableOptions.frozenColCount = editable ? 1 : 0
  tableOptions.rightFrozenColCount = editable ? 1 : 0
  if (editable) {
    tableOptions.emptyTip = { text: '暂无数据，点击「新增行」添加' }
  }
  else {
    delete tableOptions.emptyTip
  }
}

function buildColumns(f: ApiDatasetField[], editable: boolean) {
  const base: ColumnDefine[] = [
    {
      field: '__row_seq',
      title: '序号',
      width: 60,
      minWidth: 60,
      maxWidth: 120,
      headerStyle: { textAlign: 'center' },
      style: { textAlign: 'center' },
    },
  ]
  const dataCols: ColumnDefine[] = f.map((col) => {
    const headerLayout = vueGroupCustomLayout(() =>
      h('div', { style: { display: 'flex', alignItems: 'center', height: '100%' } }, [
        h(ColumnField, { field: col }),
      ]),
    )
    return {
      field: `c_${col.id}`,
      title: `${col.name} (${col.field_type})`,
      width: 160,
      headerCustomLayout: headerLayout,
    }
  })
  if (!editable) {
    return [...base, ...dataCols]
  }
  const actionsCol = {
    field: '__actions',
    title: '操作',
    minWidth: 150,
    headerStyle: {
      textAlign: 'center',
    },
    customLayout: vueGroupCustomLayout(({ record }) =>
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            height: '100%',
          },
        },
        [
          h(
            ElButton,
            {
              link: true,
              type: 'primary',
              onClick: () => openEditRow(record),
            },
            () => '编辑',
          ),
          h(
            ElButton,
            {
              link: true,
              type: 'danger',
              onClick: () => confirmDeleteRow(record),
            },
            () => '删除',
          ),
        ],
      ),
    ),
  } as ColumnDefine
  return [...base, ...dataCols, actionsCol]
}

function buildRecords(
  rows: { id: string, values: Record<string, unknown> }[],
  f: ApiDatasetField[],
  startSeq: number = 1,
) {
  return rows.map((r, index) => {
    const rec: Record<string, unknown> = {
      __row_id: r.id,
      __row_values: r.values,
      __row_seq: startSeq + index,
    }
    for (const col of f) {
      const key = String(col.id)
      rec[`c_${col.id}`] = formatCell(r.values[key])
    }
    return rec
  })
}

async function loadRowsOnly() {
  const id = props.datasetId
  if (id == null || fields.value.length === 0)
    return
  loading.value = true
  try {
    const { rows, total: t } = await fetchDatasetRowsPage(id, page.value, pageSize.value)
    tableOptions.records = buildRecords(rows, fields.value, (page.value - 1) * pageSize.value + 1)
    total.value = t
  }
  catch (e) {
    const msg = e instanceof Error ? e.message : '加载数据失败'
    ElMessage.error(msg)
    tableOptions.records = []
    total.value = 0
  }
  finally {
    loading.value = false
  }
}

async function loadDetailAndRows() {
  const id = props.datasetId
  if (id == null) {
    fields.value = []
    rowFormSchema.value = null
    tableOptions.columns = []
    tableOptions.records = []
    total.value = 0
    return
  }
  loading.value = true
  fields.value = []
  tableOptions.columns = []
  tableOptions.records = []
  syncTableFrozen(false)
  try {
    const detail = await fetchDatasetDetail(id)
    fields.value = [...detail.fields].sort((a, b) => a.sort_order - b.sort_order)
    rowFormSchema.value = createRowFormSchema(detail)
    if (fields.value.length === 0) {
      tableOptions.columns = []
      tableOptions.records = []
      syncTableFrozen(false)
      total.value = detail.row_count
      return
    }
    const { rows, total: t } = await fetchDatasetRowsPage(id, page.value, pageSize.value)
    syncTableFrozen(props.editable)
    tableOptions.columns = buildColumns(fields.value, props.editable)
    tableOptions.records = buildRecords(rows, fields.value, (page.value - 1) * pageSize.value + 1)
    total.value = t
  }
  catch (e) {
    const msg = e instanceof Error ? e.message : '加载数据失败'
    ElMessage.error(msg)
    fields.value = []
    rowFormSchema.value = null
    tableOptions.columns = []
    tableOptions.records = []
    syncTableFrozen(false)
    total.value = 0
  }
  finally {
    loading.value = false
  }
}

watch(
  () => props.editable,
  (editable: boolean) => {
    if (fields.value.length === 0)
      return
    syncTableFrozen(editable)
    tableOptions.columns = buildColumns(fields.value, editable)
  },
)

watch(
  () => props.datasetId,
  () => {
    page.value = 1
    loadDetailAndRows()
  },
  { immediate: true },
)

watch(
  () => [props.editable, props.datasetId, fields.value.length] as const,
  () => {
    if (!props.editable)
      return
    emit('addRowStateChange', {
      canAdd: props.datasetId != null && fields.value.length > 0,
    })
  },
  { immediate: true },
)

async function onPageChange(p: number) {
  page.value = p
  await loadRowsOnly()
}

async function onSizeChange(s: number) {
  pageSize.value = s
  page.value = 1
  await loadRowsOnly()
}

function openCreateRow() {
  const id = props.datasetId
  if (id == null || fields.value.length === 0)
    return
  rowDialogMode.value = 'create'
  editingRowId.value = null
  const next: Record<string, unknown> = {}
  for (const f of fields.value) next[String(f.id)] = undefined
  rowForm.value = next
  rowDialogVisible.value = true
}

function openEditRow(row: Record<string, unknown>) {
  rowDialogMode.value = 'edit'
  editingRowId.value = String(row.__row_id ?? '')
  const next: Record<string, unknown> = {}
  const schemaFields = new Map(rowFormSchema.value?.fields.map(field => [field.field, field]) ?? [])
  const recordValues = row.__row_values as Record<string, unknown> | undefined
  for (const f of fields.value) {
    next[String(f.id)] = restoreRendererValue(
      schemaFields.get(String(f.id)),
      recordValues?.[String(f.id)] ?? row[`c_${f.id}`],
    )
  }
  rowForm.value = next
  rowDialogVisible.value = true
}

function buildValuesFromForm(): Record<string, string | number | null> | null {
  const rendererValues = rowRendererRef.value?.getFormValues() ?? rowForm.value
  const values: Record<string, string | number | null> = {}
  try {
    for (const field of fields.value) {
      values[String(field.id)] = normalizeRendererValue(field, rendererValues[String(field.id)])
    }
    return values
  }
  catch (error) {
    ElMessage.warning((error as Error).message)
    return null
  }
}

async function submitRowDialog() {
  const id = props.datasetId
  if (id == null)
    return
  const values = buildValuesFromForm()
  if (values == null)
    return
  rowSubmitting.value = true
  try {
    if (rowDialogMode.value === 'create') {
      await createDatasetRow(id, { values })
      ElMessage.success('已新增一行')
    }
    else {
      const rid = editingRowId.value
      if (rid == null)
        return
      await updateDatasetRow(id, rid, { values })
      ElMessage.success('已保存')
    }
    rowDialogVisible.value = false
    await loadRowsOnly()
    emit('rowsUpdated')
  }
  catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '保存失败')
  }
  finally {
    rowSubmitting.value = false
  }
}

async function confirmDeleteRow(row: Record<string, unknown>) {
  const id = props.datasetId
  if (id == null)
    return
  const rowId = String(row.__row_id ?? '')
  try {
    await ElMessageBox.confirm('确定删除该行吗？此操作不可恢复。', '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  }
  catch {
    return
  }
  try {
    await deleteDatasetRow(id, rowId)
    ElMessage.success('已删除')
    if (tableOptions.records.length <= 1 && page.value > 1) {
      page.value -= 1
    }
    await loadRowsOnly()
    emit('rowsUpdated')
  }
  catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '删除失败')
  }
}

defineExpose({ openCreateRow })
</script>

<template>
  <div :class="$style.wrap">
    <div v-if="datasetId == null" :class="$style.empty">
      请从左侧选择一个数据集
    </div>
    <template v-else>
      <div v-if="!loading && fields.length === 0" :class="$style.hint">
        该数据集尚未定义字段，请通过接口或后续「字段管理」功能添加字段后再录入行数据。
      </div>
      <template v-else-if="editable">
        <div v-loading="loading" :class="$style.editArea">
          <div class="w-full flex-auto h-0">
            <el-auto-resizer>
              <template #default="{ height, width }">
                <ElListTable :options="tableOptions" :width="width" :height="height" />
              </template>
            </el-auto-resizer>
          </div>
          <div v-if="fields.length > 0" :class="$style.pager">
            <el-pagination
              background
              layout="total, sizes, prev, pager, next"
              :total="total"
              :page-size="pageSize"
              :current-page="page"
              :page-sizes="[10, 20, 50, 100]"
              @current-change="onPageChange"
              @size-change="onSizeChange"
            />
          </div>
        </div>
        <AdaptiveDialog
          v-model="rowDialogVisible"
          :title="rowDialogMode === 'create' ? '新增行' : '编辑行'"
          width="960px"
          destroy-on-close
          append-to-body
          @closed="editingRowId = null"
        >
          <el-scrollbar max-height="60vh">
            <FormRenderer
              v-if="rowFormSchema"
              ref="rowRendererRef"
              :schema="rowFormSchema"
              :initial-values="rowForm"
            />
          </el-scrollbar>

          <template #footer>
            <ElButton @click="rowDialogVisible = false">
              取消
            </ElButton>
            <ElButton type="primary" :loading="rowSubmitting" @click="submitRowDialog">
              保存
            </ElButton>
          </template>
        </AdaptiveDialog>
      </template>
      <div v-else v-loading="loading" :class="$style.tableArea">
        <div class="w-full flex-auto h-0">
          <el-auto-resizer>
            <template #default="{ height, width }">
              <ElListTable :options="tableOptions" :width="width" :height="height" />
            </template>
          </el-auto-resizer>
        </div>
        <div v-if="fields.length > 0" :class="$style.pager">
          <el-pagination
            background
            layout="total, sizes, prev, pager, next"
            :total="total"
            :page-size="pageSize"
            :current-page="page"
            :page-sizes="[10, 20, 50, 100]"
            @current-change="onPageChange"
            @size-change="onSizeChange"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style module lang="css">
.wrap {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 420px;
}

.empty,
.hint {
  padding: 24px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.tableArea,
.editArea {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  height: 100%;
}

.pager {
  display: flex;
  justify-content: flex-end;
  height: 60px;
  padding: 0 12px;
}
</style>
