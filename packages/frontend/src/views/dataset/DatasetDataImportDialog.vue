<script setup lang="ts">
import type { UploadFile } from 'element-plus'
import type { ApiDatasetField } from '@/api/dataset'
import { Download, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, ref, watch } from 'vue'
import * as XLSX from 'xlsx'
import { createDatasetRows } from '@/api/dataset'
import { AdaptiveDialog } from '@/components/adaptive-dialog'

const props = defineProps<{
  modelValue: boolean
  datasetId: string | null
  datasetName: string
  fields: ApiDatasetField[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'imported': []
}>()

const importRows = ref<Record<string, string | number | null>[]>([])
const uploadName = ref('')
const importing = ref(false)

const sortedFields = computed(() => [...props.fields].sort((a, b) => a.sort_order - b.sort_order))
const canImport = computed(() => props.datasetId != null && sortedFields.value.length > 0 && importRows.value.length > 0)

function reset() {
  importRows.value = []
  uploadName.value = ''
}

watch(() => props.modelValue, (visible) => {
  if (!visible)
    reset()
})

function close() {
  emit('update:modelValue', false)
}

function downloadTemplate() {
  if (sortedFields.value.length === 0) {
    ElMessage.warning('请先设计数据集字段，再下载导入模板')
    return
  }
  const worksheet = XLSX.utils.aoa_to_sheet([sortedFields.value.map(field => field.name)])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '数据导入模板')
  XLSX.writeFile(workbook, `${props.datasetName || '数据集'}-导入模板.xlsx`)
}

function normalizeCellValue(value: unknown, field: ApiDatasetField): string | number | null {
  if (value === undefined || value === null || String(value).trim() === '')
    return null
  if (field.field_type === 'number') {
    const numberValue = typeof value === 'number' ? value : Number(String(value).trim())
    if (!Number.isFinite(numberValue))
      throw new Error(`字段「${field.name}」须为有效数字`)
    return numberValue
  }
  if (field.field_type === 'datetime') {
    const dateValue = value instanceof Date ? value : new Date(String(value))
    if (Number.isNaN(dateValue.getTime()))
      throw new Error(`字段「${field.name}」须为有效日期时间`)
    return dateValue.toISOString()
  }
  return typeof value === 'string' ? value : String(value)
}

async function handleFileChange(uploadFile: UploadFile) {
  const file = uploadFile.raw
  if (!file)
    return
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!['xlsx', 'xls', 'csv'].includes(extension ?? '')) {
    ElMessage.error('仅支持 .xlsx、.xls 或 .csv 文件')
    return
  }
  if (file.size > 20 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过 20 MB')
    return
  }
  if (sortedFields.value.length === 0) {
    ElMessage.warning('请先设计数据集字段，再导入数据')
    return
  }

  try {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    if (!firstSheet)
      throw new Error('未找到可导入的工作表')
    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1, defval: null, raw: false })
    const [headers, ...dataRows] = rawRows
    if (!headers?.length)
      throw new Error('文件缺少表头行')
    const headerIndexes = new Map(headers.map((header, index) => [String(header).trim(), index]))
    const missingFields = sortedFields.value.filter(field => !headerIndexes.has(field.name))
    if (missingFields.length) {
      throw new Error(`缺少字段列：${missingFields.map(field => field.name).join('、')}`)
    }

    const rows = dataRows
      .filter(row => row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== ''))
      .map((row, rowIndex) => {
        const values: Record<string, string | number | null> = {}
        for (const field of sortedFields.value) {
          try {
            values[field.id] = normalizeCellValue(row[headerIndexes.get(field.name)!], field)
          }
          catch (error) {
            const message = error instanceof Error ? error.message : '数据格式无效'
            throw new Error(`第 ${rowIndex + 2} 行：${message}`)
          }
        }
        return values
      })
    if (rows.length === 0)
      throw new Error('未检测到可导入的数据行')
    if (rows.length > 1000)
      throw new Error('单次最多导入 1000 行数据')

    importRows.value = rows
    uploadName.value = file.name
  }
  catch (error) {
    reset()
    ElMessage.error(error instanceof Error ? error.message : '文件解析失败')
  }
}

async function submitImport() {
  if (!props.datasetId || !canImport.value)
    return
  importing.value = true
  try {
    const result = await createDatasetRows(props.datasetId, importRows.value)
    ElMessage.success(`已导入 ${result.count} 条数据`)
    emit('imported')
    close()
  }
  catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '数据导入失败')
  }
  finally {
    importing.value = false
  }
}
</script>

<template>
  <AdaptiveDialog
    :model-value="modelValue"
    title="导入数据"
    width="560px"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="dataset-data-import">
      <p class="dataset-data-import__description">
        下载模板后按字段填写数据，再上传 Excel 或 CSV 文件。第一行必须保留模板中的字段名称。
      </p>
      <el-button text type="primary" :icon="Download" @click="downloadTemplate">
        下载导入模板
      </el-button>

      <el-upload
        class="dataset-data-import__upload"
        drag
        :auto-upload="false"
        :show-file-list="false"
        accept=".xlsx,.xls,.csv"
        :on-change="handleFileChange"
      >
        <el-icon class="el-icon--upload">
          <UploadFilled />
        </el-icon>
        <div class="el-upload__text">
          拖拽文件到此处或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 .xlsx、.xls、.csv，文件大小不超过 20 MB，单次最多导入 1000 行。
          </div>
        </template>
      </el-upload>

      <el-alert
        v-if="uploadName"
        class="mt-4"
        type="success"
        :closable="false"
        :title="`已读取「${uploadName}」，待导入 ${importRows.length} 条数据`"
      />
    </div>
    <template #footer>
      <el-button @click="close">
        取消
      </el-button>
      <el-button type="primary" :loading="importing" :disabled="!canImport" @click="submitImport">
        导入 {{ importRows.length ? `${importRows.length} 条数据` : '' }}
      </el-button>
    </template>
  </AdaptiveDialog>
</template>

<style scoped>
.dataset-data-import__description {
  margin: 0 0 8px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}

.dataset-data-import__upload {
  margin-top: 16px;
}
</style>
