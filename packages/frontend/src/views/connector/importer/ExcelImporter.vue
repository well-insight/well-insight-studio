<script setup lang="ts">
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, ref } from 'vue'
import * as XLSX from 'xlsx'
import TableDemo from '../components/TableDemo.vue'

// ----- 类型定义 -----
interface SystemField {
  field: string // 系统字段英文名
  label: string // 显示名称
  required: boolean // 是否必填
  type: string // 'string' | 'number' | 'date' // 数据类型
}

interface RawRow {
  [key: string]: any
}

interface ValidatedRow {
  [field: string]: any
  _errors?: Record<string, string>
}

// ----- props & emits -----
const props = defineProps<{
  // 系统字段定义（从父组件传入）
  fields: SystemField[]
  // 提交接口
  submitApi: (data: any[]) => Promise<any>
}>()

const emit = defineEmits<{
  (e: 'success', data: any[]): void
  (e: 'close'): void
}>()

// ----- 响应式数据 -----
const step = ref(0) // 当前步骤
const rawData = ref<RawRow[]>([]) // 原始解析数据
const excelColumns = ref<string[]>([]) // Excel 列名

// 映射关系：系统字段 -> Excel 列名
const mapping = ref<Record<string, string>>({})
// 默认值：系统字段 -> 默认值
const defaultValues = ref<Record<string, string>>({})

const validatedData = ref<ValidatedRow[]>([]) // 校验后的数据
const errors = ref<string[]>([]) // 全局错误信息
const submitting = ref(false)

// 系统字段列表（用于渲染映射表）
const systemFields = computed(() => props.fields)

// 预览数据（带错误标记）
const previewData = computed(() => {
  return validatedData.value.slice(0, 100) // 只预览前100行，避免渲染过慢
})

// ----- 辅助函数 -----
/**
 * 解析 Excel 文件
 */
function parseExcel(file: File): Promise<RawRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      // 将第一行作为列名
      const json = XLSX.utils.sheet_to_json<RawRow>(firstSheet, { defval: '' })
      resolve(json)
    }
    reader.onerror = err => reject(err)
    reader.readAsArrayBuffer(file)
  })
}

/**
 * 文件上传前的校验
 */
function handleBeforeUpload(file: File) {
  const isValidType = ['.xlsx', '.xls', '.csv'].some(ext => file.name.toLowerCase().endsWith(ext))
  if (!isValidType) {
    ElMessage.error('仅支持 .xlsx, .xls, .csv 格式文件')
    return false
  }
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB')
    return false
  }
  return true
}

/**
 * 文件选择变化时解析
 */
async function handleFileChange(file: File) {
  try {
    const data = await parseExcel(file)
    if (!data.length) {
      ElMessage.warning('文件为空')
      return
    }
    rawData.value = data
    // 获取列名（对象键名）
    excelColumns.value = Object.keys(data[0])
    // 初始化映射关系：如果系统字段名与列名匹配，自动建立映射
    const initialMapping: Record<string, string> = {}
    for (const field of systemFields.value) {
      if (excelColumns.value.includes(field.field)) {
        initialMapping[field.field] = field.field
      } else {
        // 尝试匹配标签（如果列名包含字段标签）
        const matched = excelColumns.value.find(col => field.label.includes(col) || col.includes(field.label))
        if (matched) initialMapping[field.field] = matched
      }
    }
    mapping.value = initialMapping
    defaultValues.value = {}
    step.value = 1 // 进入字段映射步骤
  } catch (error) {
    console.error('解析失败', error)
    ElMessage.error('文件解析失败，请检查格式')
  }
}

/**
 * 映射改变时触发（可做额外处理，如清空默认值）
 */
function handleMappingChange() {
  // 可以添加逻辑，比如当某个字段映射变化时，清空相关默认值等
}

/**
 * 跳转到预览步骤，并进行数据转换与校验
 */
function goToPreview() {
  // 检查必填字段是否都有映射
  const missingRequired = systemFields.value.filter(f => f.required && !mapping.value[f.field]).map(f => f.label)
  if (missingRequired.length) {
    ElMessage.error(`必填字段未映射：${missingRequired.join(', ')}`)
    return
  }

  // 转换数据并校验
  const newValidatedData: ValidatedRow[] = []
  const newErrors: string[] = []

  for (let i = 0; i < rawData.value.length; i++) {
    const row = rawData.value[i]
    const newRow: ValidatedRow = {}
    const rowErrors: Record<string, string> = {}

    for (const field of systemFields.value) {
      const excelCol = mapping.value[field.field]
      let val = excelCol ? row[excelCol] : undefined

      // 应用默认值
      if ((val === undefined || val === '') && defaultValues.value[field.field]) {
        val = defaultValues.value[field.field]
      }

      // 类型校验与转换
      if (val !== undefined && val !== '') {
        if (field.type === 'number') {
          const num = Number(val)
          if (Number.isNaN(num)) {
            rowErrors[field.field] = `${field.label} 应为数字`
            newErrors.push(`第 ${i + 2} 行：${field.label} 格式错误`)
          } else {
            newRow[field.field] = num
          }
        } else if (field.type === 'date') {
          const date = new Date(val)
          if (Number.isNaN(date.getTime())) {
            rowErrors[field.field] = `${field.label} 应为日期格式`
            newErrors.push(`第 ${i + 2} 行：${field.label} 格式错误`)
          } else {
            newRow[field.field] = date.toISOString().slice(0, 10) // 转为 YYYY-MM-DD
          }
        } else {
          newRow[field.field] = String(val)
        }
      } else if (field.required) {
        rowErrors[field.field] = `${field.label} 不能为空`
        newErrors.push(`第 ${i + 2} 行：${field.label} 不能为空`)
      } else {
        newRow[field.field] = null // 可选字段留空
      }
    }

    if (Object.keys(rowErrors).length) {
      newRow._errors = rowErrors
    }
    newValidatedData.push(newRow)
  }

  validatedData.value = newValidatedData
  errors.value = newErrors
  step.value = 2 // 进入预览步骤
}

/**
 * 提交数据
 */
async function handleSubmit() {
  if (errors.value.length) {
    ElMessage.error('请先修正数据错误后再提交')
    return
  }
  submitting.value = true
  try {
    // 移除 _errors 临时字段
    const dataToSubmit = validatedData.value.map(({ _errors, ...rest }) => rest)
    await props.submitApi(dataToSubmit)
    ElMessage.success('导入成功')
    emit('success', dataToSubmit)
    // 关闭弹窗或重置组件
    emit('close')
  } catch (error) {
    console.error('提交失败', error)
    ElMessage.error('导入失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="excel-importer">
    <el-card class="w-full h-full">
      <template #header>
        <!-- 步骤条 -->
        <el-steps :active="step" finish-status="success" align-center>
          <el-step title="上传文件" />
          <el-step title="字段映射" />
          <el-step title="预览确认" />
        </el-steps>
      </template>

      <div class="w-full h-full">
        <!-- 步骤1：上传文件 -->
        <div v-if="step === 0" class="step-upload">
          <el-upload
            drag
            :auto-upload="false"
            :show-file-list="false"
            :before-upload="handleBeforeUpload"
            :on-change="handleFileChange"
            class="mb-[40px]"
            accept=".xlsx, .xls, .csv"
          >
            <el-icon class="el-icon--upload">
              <UploadFilled />
            </el-icon>
            <div class="el-upload__text">拖拽文件到此处或<em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip">支持 .xlsx, .xls, .csv 格式，文件大小不超过 10MB</div>
            </template>
          </el-upload>

          <TableDemo />
        </div>

        <!-- 步骤2：字段映射 -->
        <div v-if="step === 1" class="step-mapping">
          <el-alert title="请将 Excel 列映射到系统字段" type="info" show-icon :closable="false" />
          <el-table :data="systemFields" style="width: 100%; margin-top: 20px">
            <el-table-column prop="label" label="系统字段" width="200">
              <template #default="{ row }">
                {{ row.label }}<span v-if="row.required" style="color: red">*</span>
              </template>
            </el-table-column>
            <el-table-column label="Excel 列">
              <template #default="{ row }">
                <el-select
                  v-model="mapping[row.field]"
                  placeholder="请选择对应列"
                  clearable
                  @change="handleMappingChange"
                >
                  <el-option v-for="col in excelColumns" :key="col" :label="col" :value="col" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="默认值（可选）">
              <template #default="{ row }">
                <el-input v-model="defaultValues[row.field]" placeholder="留空则使用原始值" />
              </template>
            </el-table-column>
          </el-table>
          <div class="mapping-actions">
            <el-button @click="step--"> 上一步 </el-button>
            <el-button type="primary" @click="goToPreview"> 下一步 </el-button>
          </div>
        </div>

        <!-- 步骤3：预览确认 -->
        <div v-if="step === 2" class="step-preview">
          <el-alert
            v-if="errors.length > 0"
            title="数据存在错误，请修正后提交"
            type="error"
            show-icon
            :closable="false"
          />
          <el-table :data="previewData" style="width: 100%; margin-top: 20px" border max-height="500">
            <el-table-column
              v-for="field in Object.keys(mapping).filter(k => mapping[k])"
              :key="field"
              :prop="field"
              :label="systemFields.find(f => f.field === field)?.label || field"
              width="150"
            >
              <template #default="{ row }">
                <span :class="{ 'error-cell': row._errors?.[field] }">
                  {{ row[field] }}
                </span>
              </template>
            </el-table-column>
          </el-table>
          <div class="preview-actions">
            <el-button @click="step--"> 上一步 </el-button>
            <el-button type="primary" :loading="submitting" @click="handleSubmit"> 确认导入 </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.excel-importer {
  padding: 12px;
  width: 100%;
  height: 100%;

  :deep(.el-card) {
    --el-card-padding: 12px;
  }

  .step-upload {
    height: 100%;
    width: 100%;
    padding: 0 100px;
    :deep(.el-upload-dragger) {
      width: 100%;
      min-height: 200px;
    }
  }

  .step-mapping {
    .mapping-actions {
      margin-top: 20px;
      text-align: center;
    }
  }

  .step-preview {
    .error-cell {
      color: #f56c6c;
      font-weight: bold;
    }
    .preview-actions {
      margin-top: 20px;
      text-align: center;
    }
  }
}
</style>
