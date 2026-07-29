<script setup lang="ts">
import type { UploadFile } from 'element-plus'
import type { ConnectorFieldConfig, ConnectorFieldType } from '@/api/connector'
import type { ApiFolderTreeNode } from '@/api/dataset'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage, ElNotification } from 'element-plus'
import { computed, ref, watch } from 'vue'
import { importDataset as apiImportDataset, parseFile as apiParseFile } from '@/api/connector'
import { fetchDatasetFolderTree } from '@/api/dataset'
import TableDemo from '../components/TableDemo.vue'

// ─── Emits ───────────────────────────────────────────────────────────
const emit = defineEmits<{
  success: [datasetId: string, datasetName: string]
  close: []
}>()

// ─── 步骤控制 ─────────────────────────────────────────────────────────
const step = ref(0) // 0=上传  1=配置字段  2=数据预览  3=创建

// ─── Step 1：上传结果 ─────────────────────────────────────────────────
const uploading = ref(false)
const uploadProgress = ref(0)
const sessionId = ref('')
const totalRows = ref(0)

/** 原始行矩阵（前 10 行），每行是 unknown[] */
const previewMatrix = ref<unknown[][]>([])
const colCount = ref(0)

// ─── Step 2：表头选择 & 字段配置 ──────────────────────────────────────
/** 哪一行作为表头（0-based） */
const headerRowIndex = ref(0)

/** 字段配置列表 */
const fieldConfigs = ref<ConnectorFieldConfig[]>([])

const typeOptions: { label: string, value: ConnectorFieldType }[] = [
  { label: '文本', value: 'text' },
  { label: '数字', value: 'number' },
  { label: '日期时间', value: 'datetime' },
]

/** 全选状态 */
const allIncluded = computed(
  () => fieldConfigs.value.length > 0 && fieldConfigs.value.every(f => f.include),
)
const someIncluded = computed(
  () => fieldConfigs.value.some(f => f.include) && !allIncluded.value,
)
function toggleAllInclude(val: boolean) {
  fieldConfigs.value.forEach(f => (f.include = val))
}

// ─── 前端自动推断列类型 ────────────────────────────────────────────────
function detectColumnType(values: unknown[]): ConnectorFieldType {
  const nonEmpty = values.filter(v => v !== null && v !== undefined && String(v).trim() !== '')
  if (nonEmpty.length === 0)
    return 'text'
  if (nonEmpty.every(v => !isNaN(Number(String(v).trim())) && String(v).trim() !== ''))
    return 'number'
  const dateRe = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/
  if (
    nonEmpty.every((v) => {
      const s = String(v).trim()
      return dateRe.test(s) && !isNaN(Date.parse(s))
    })
  ) {
    return 'datetime'
  }
  return 'text'
}

/**
 * 根据当前 headerRowIndex 重新计算 fieldConfigs
 * 尽量保留用户已改过的 name / type / include
 */
function rebuildFieldConfigs() {
  const matrix = previewMatrix.value
  if (matrix.length === 0)
    return
  const headerRow = (matrix[headerRowIndex.value] ?? []) as ConnectorFieldConfig[]
  const dataRows = matrix.filter((_, i) => i > headerRowIndex.value)

  fieldConfigs.value = Array.from({ length: colCount.value }, (_, ci) => {
    const headerVal = String(headerRow[ci] ?? '')
    const colValues = dataRows.map(r => (r as unknown[])[ci])
    return {
      colIndex: ci,
      header: headerVal || `列${ci + 1}`,
      name: headerVal || `列${ci + 1}`,
      type: detectColumnType(colValues),
      include: true,
    }
  })
}

// 表头行变化时重建字段配置
watch(headerRowIndex, rebuildFieldConfigs)

// ─── 原始矩阵转 el-table 可用格式（用于表头选择表格）─────────────────
const rawTableData = computed(() =>
  previewMatrix.value.map((row, rowIdx) => {
    const obj: Record<string, unknown> = { _rowIndex: rowIdx };
    (row as unknown[]).forEach((value, ci) => {
      const field = fieldConfigs.value.find(item => item.colIndex === ci)
      obj[`c${ci}`] = field?.type === 'datetime' && value !== null && value !== undefined && String(value).trim() !== ''
        ? formatPreviewDateTime(value)
        : value ?? ''
    })
    return obj
  }),
)

/** 动态生成的列（最多展示前 8 列，避免过宽） */
const rawTableColumns = computed(() => {
  const count = Math.min(colCount.value, 8)
  return Array.from({ length: count }, (_, ci) => ({
    prop: `c${ci}`,
    label: `列 ${ci + 1}`,
  }))
})

// ─── 数据预览表格数据（el-table） ────────────────────────────────────
function formatPreviewDateTime(value: unknown): string {
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime()))
    return String(value)
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/** 预览表格的数据行 */
const previewTableData = computed(() => {
  const included = fieldConfigs.value.filter(f => f.include)
  const dataRows = previewMatrix.value.filter((_, i) => i !== headerRowIndex.value)

  if (included.length === 0 || dataRows.length === 0)
    return []

  return dataRows.map((row) => {
    const rec: Record<string, unknown> = {}
    included.forEach((f) => {
      const value = (row as unknown[])[f.colIndex]
      rec[`c${f.colIndex}`] = f.type === 'datetime' && value !== null && value !== undefined && String(value).trim() !== ''
        ? formatPreviewDateTime(value)
        : value ?? ''
    })
    return rec
  })
})

/** 预览表格的列定义 */
const previewTableColumns = computed(() => {
  const included = fieldConfigs.value.filter(f => f.include)

  return included.map(f => ({
    prop: `c${f.colIndex}`,
    label: f.name,
    minWidth: 120,
    align: f.type === 'number' ? 'right' : 'left',
    headerAlign: 'center',
  }))
})

// ─── Step 4：数据集信息 ───────────────────────────────────────────────
const datasetName = ref('')
const sourceDatasetName = ref('')
const datasetDesc = ref('')
const datasetFolderId = ref<string | null>(null)
const folderTree = ref<ApiFolderTreeNode[]>([])
const folderLoading = ref(false)
const submitting = ref(false)

const includedCount = computed(() => fieldConfigs.value.filter(f => f.include).length)

// ─── 进入 Step 4 时加载文件夹树 ──────────────────────────────────────
watch(
  () => step.value,
  async (s) => {
    if (s === 3 && folderTree.value.length === 0) {
      folderLoading.value = true
      try {
        folderTree.value = (await fetchDatasetFolderTree(null)) ?? []
      }
      catch {
        folderTree.value = []
      }
      finally {
        folderLoading.value = false
      }
    }
  },
)

// ─── 文件上传处理 ─────────────────────────────────────────────────────
function beforeUpload(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!['xlsx', 'xls', 'csv'].includes(ext ?? '')) {
    ElMessage.error('仅支持 .xlsx / .xls / .csv 格式')
    return false
  }
  if (file.size > 20 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过 20MB')
    return false
  }
  return true
}

async function handleFileChange(uploadFile: UploadFile) {
  const file = uploadFile.raw
  if (!file || !beforeUpload(file))
    return

  uploading.value = true
  uploadProgress.value = 0
  try {
    const data = await apiParseFile(file, pct => (uploadProgress.value = pct))
    sessionId.value = data.sessionId
    sourceDatasetName.value = file.name.replace(/\.[^.]+$/, '').trim() || '未命名数据集'
    totalRows.value = data.totalRows
    previewMatrix.value = data.previewMatrix ?? []
    colCount.value = data.colCount ?? 0
    headerRowIndex.value = 0
    fieldConfigs.value = []
    rebuildFieldConfigs()
    step.value = 1
  }
  catch (e: any) {
    ElMessage.error(e?.message ?? '文件解析失败')
  }
  finally {
    uploading.value = false
  }
}

// ─── Step 1 → Step 2 校验 ─────────────────────────────────────────────
function goToPreviewStep() {
  if (includedCount.value === 0) {
    ElMessage.warning('请至少选择一个字段')
    return
  }
  const names = fieldConfigs.value.filter(f => f.include).map(f => f.name.trim())
  if (names.some(n => !n)) {
    ElMessage.warning('字段名称不能为空')
    return
  }
  if (new Set(names).size !== names.length) {
    ElMessage.warning('字段名称不能重复')
    return
  }
  step.value = 2
}

function goToCreateStep() {
  datasetName.value = sourceDatasetName.value
  datasetDesc.value = ''
  datasetFolderId.value = null
  step.value = 3
}

function selectHeaderRow(rowIndex: number) {
  headerRowIndex.value = rowIndex
}

// ─── 确认导入 ─────────────────────────────────────────────────────────
async function handleSubmit() {
  const name = datasetName.value.trim()
  if (!name) {
    ElMessage.warning('请输入数据集名称')
    return
  }
  submitting.value = true
  try {
    const method = apiImportDataset({
      sessionId: sessionId.value,
      headerRowIndex: headerRowIndex.value,
      fields: fieldConfigs.value,
      dataset: {
        name,
        description: datasetDesc.value.trim() || null,
        folder_id: datasetFolderId.value || null,
        project_id: null,
      },
    })
    const result = await (method as any).send()
    ElNotification({
      title: '导入成功',
      message: `「${result.name}」已创建，共 ${result.row_count} 行，${result.field_count} 个字段`,
      type: 'success',
      duration: 4000,
    })
    emit('success', result.id, result.name)
  }
  catch (e: any) {
    ElMessage.error(e?.message ?? '导入失败，请重试')
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div :class="$style.wrap">
    <!-- 步骤条 -->
    <div :class="$style.stepsBar">
      <el-steps :active="step" finish-status="success" align-center>
        <el-step title="上传文件" description="Excel / CSV" />
        <el-step title="配置字段" description="选择表头与字段类型" />
        <el-step title="数据预览" description="确认导入内容" />
        <el-step title="创建数据集" description="填写基本信息" />
      </el-steps>
    </div>

    <!-- ══ Step 0：上传 ══════════════════════════════════════════════ -->
    <div v-if="step === 0" :class="$style.stepBody">
      <div :class="$style.uploadArea">
        <el-upload
          drag
          :auto-upload="false"
          :show-file-list="false"
          accept=".xlsx,.xls,.csv"
          :on-change="handleFileChange"
          :disabled="uploading"
          :class="$style.uploader"
        >
          <el-icon class="el-icon--upload">
            <UploadFilled />
          </el-icon>
          <div class="el-upload__text">
            拖拽文件到此处或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持 .xlsx / .xls / .csv 格式，文件大小不超过 20 MB
            </div>
          </template>
        </el-upload>

        <div v-if="uploading" :class="$style.progressWrap">
          <el-progress :percentage="uploadProgress" striped striped-flow :duration="5" />
          <p>正在解析文件，请稍候…</p>
        </div>

        <div :class="$style.demoWrap">
          <TableDemo />
        </div>
      </div>

      <div :class="$style.footer">
        <el-button @click="emit('close')">
          取消
        </el-button>
      </div>
    </div>

    <!-- ══ Step 1：配置字段 ══════════════════════════════════════════ -->
    <div v-else-if="step === 1" :class="$style.stepBody">
      <div :class="$style.stepBodyScroll">
        <!-- ① 表头行选择 -->
        <div :class="$style.section">
          <div :class="$style.sectionTitle">
            <el-text type="primary" size="small" tag="b">
              ① 选择表头行
            </el-text>
            <el-text type="info" size="small">
              点击左侧按钮指定哪一行作为字段名（当前选第
              <b>{{ headerRowIndex + 1 }}</b> 行）
            </el-text>
          </div>
          <el-table
            :data="rawTableData"
            border
            size="small"
            max-height="220"
            style="width: 100%"
            :row-class-name="
              ({ row }) => (row._rowIndex === headerRowIndex ? $style.headerRow : '')
            "
          >
            <el-table-column width="92" label="表头" align="center" fixed>
              <template #default="{ row }: { row: Record<string, unknown> }">
                <el-button
                  size="small"
                  :type="row._rowIndex === headerRowIndex ? 'primary' : 'default'"
                  @click="selectHeaderRow(row._rowIndex as number)"
                >
                  第 {{ (row._rowIndex as number) + 1 }} 行
                </el-button>
              </template>
            </el-table-column>
            <el-table-column
              v-for="col in rawTableColumns"
              :key="col.prop"
              :prop="col.prop"
              :label="col.label"
              min-width="100"
              show-overflow-tooltip
            />
          </el-table>
        </div>

        <!-- ② 字段配置 -->
        <div :class="$style.section">
          <div :class="$style.sectionTitle">
            <el-text type="primary" size="small" tag="b">
              ② 配置字段
            </el-text>
            <el-text type="info" size="small">
              共 <b>{{ fieldConfigs.length }}</b> 列，已选 <b>{{ includedCount }}</b> 个
            </el-text>
          </div>
          <div :class="$style.sectionBody">
            <el-table :data="fieldConfigs" border size="small" height="100%" style="width: 100%">
              <el-table-column width="50" align="center">
                <template #header>
                  <el-checkbox
                    :model-value="allIncluded"
                    :indeterminate="someIncluded"
                    @change="(v: any) => toggleAllInclude(!!v)"
                  />
                </template>
                <template #default="{ row }: { row: ConnectorFieldConfig }">
                  <el-checkbox v-model="row.include" />
                </template>
              </el-table-column>
              <el-table-column
                prop="header"
                label="原始列值"
                min-width="120"
                show-overflow-tooltip
              />
              <el-table-column label="字段名称" min-width="150">
                <template #default="{ row }: { row: ConnectorFieldConfig }">
                  <el-input
                    v-model="row.name"
                    :disabled="!row.include"
                    size="small"
                    placeholder="字段名称"
                  />
                </template>
              </el-table-column>
              <el-table-column label="数据类型" width="130">
                <template #default="{ row }: { row: ConnectorFieldConfig }">
                  <el-select
                    v-model="row.type"
                    :disabled="!row.include"
                    size="small"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="opt in typeOptions"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
      <!-- end stepBodyScroll -->

      <div :class="$style.footer">
        <el-button @click="step = 0">
          上一步
        </el-button>
        <el-button type="primary" @click="goToPreviewStep">
          下一步
        </el-button>
      </div>
    </div>

    <!-- ══ Step 2：数据预览 ══════════════════════════════════════════ -->
    <div v-else-if="step === 2" :class="$style.stepBody">
      <div :class="$style.stepBodyScroll">
        <div :class="$style.section">
          <div :class="$style.sectionTitle">
            <el-text type="primary" size="small" tag="b">
              ③ 数据预览
            </el-text>
            <el-text type="info" size="small">
              表头以下的数据行（最多展示 {{ previewMatrix.length - 1 }} 行）
            </el-text>
          </div>
          <div :class="$style.previewTable">
            <el-table
              :data="previewTableData"
              border
              size="small"
              style="width: 100%"
              height="100%"
            >
              <el-table-column
                v-for="col in previewTableColumns"
                :key="col.prop"
                :prop="col.prop"
                :label="col.label"
                :min-width="col.minWidth"
                :align="col.align"
                :header-align="col.headerAlign"
                show-overflow-tooltip
              />
            </el-table>
          </div>
        </div>
      </div>

      <div :class="$style.footer">
        <el-button @click="step = 1">
          上一步
        </el-button>
        <el-button type="primary" @click="goToCreateStep">
          下一步
        </el-button>
      </div>
    </div>

    <!-- ══ Step 3：创建数据集 ════════════════════════════════════════ -->
    <div v-else-if="step === 3" :class="$style.stepBody">
      <div :class="$style.formWrap">
        <el-form label-position="top" style="max-width: 520px; margin: 0 auto">
          <el-form-item label="数据集名称" required>
            <el-input
              v-model="datasetName"
              placeholder="请输入数据集名称"
              maxlength="100"
              show-word-limit
              clearable
            />
          </el-form-item>
          <el-form-item label="描述（可选）">
            <el-input
              v-model="datasetDesc"
              type="textarea"
              :rows="3"
              placeholder="简要描述该数据集"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="保存到文件夹（可选）">
            <el-tree-select
              v-model="datasetFolderId"
              :data="folderTree"
              :props="{ label: 'name', children: 'children' }"
              value-key="id"
              :loading="folderLoading"
              placeholder="不选则保存到根目录"
              clearable
              filterable
              check-strictly
              style="width: 100%"
            />
          </el-form-item>
          <el-alert type="info" :closable="false" style="margin-bottom: 16px">
            <template #default>
              即将导入 <b>{{ totalRows - 1 }}</b> 行数据（表头占 1 行），共
              <b>{{ includedCount }}</b> 个字段
            </template>
          </el-alert>
        </el-form>
      </div>
      <div :class="$style.footer">
        <el-button @click="step = 2">
          上一步
        </el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          确认创建
        </el-button>
      </div>
    </div>
  </div>
</template>

<style module lang="css">
.wrap {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.stepsBar {
  flex-shrink: 0;
  padding: 20px 40px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.stepBody {
  flex: 1;
  height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.stepBodyScroll {
  flex: 1;
  height: 0;
  overflow-y: auto;
  padding: 0 0 4px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

/* ── Step 0 上传 ── */
.uploadArea {
  flex: 1;
  height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 24px 48px;
  gap: 20px;
}

.uploader {
  width: 100%;
}

.progressWrap {
  width: 100%;
  text-align: center;
}

.progressWrap p {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.demoWrap {
  width: 100%;
}

/* ── Step 1 通用分区 ── */
.section {
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.section:last-child {
  border-bottom: none;
  flex: 1;
  height: 0;
  display: flex;
  flex-direction: column;
}

.sectionTitle {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.sectionBody {
  flex: 1;
  height: 0;
  padding: 0 0 4px;
}

/* 选中表头行高亮 */
.headerRow {
  background-color: var(--el-color-primary-light-9) !important;
}

.previewTable {
  flex-shrink: 0;
  height: 0;
  flex: 1;
  width: 100%;
}

/* ── Step 2 创建 ── */
.formWrap {
  flex: 1;
  overflow-y: auto;
  padding: 24px 16px;
}

/* ── 通用底栏 ── */
.footer {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 14px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}
</style>
