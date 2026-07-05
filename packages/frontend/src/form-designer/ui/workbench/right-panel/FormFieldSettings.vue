<script lang="ts" setup>
/**
 * 字段属性编辑面板
 * 选中字段后显示其可编辑属性，含数据绑定
 */
import type { ApiDatasetField, ApiDatasetListItem } from '@/api/dataset'
import type { FormField, FormOption, FormRule } from '../../../types'
import { Delete, Link, Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref, watch } from 'vue'
import { fetchAllDatasets, fetchDatasetDetail } from '@/api/dataset'
import { getFormComponent } from '../../../form-component-registry'

const props = defineProps<{
  field: FormField | null
}>()

const emit = defineEmits<{
  (e: 'update', vid: string, patch: Partial<FormField>): void
}>()

/** 本地编辑缓存 */
const local = ref<FormField | null>(null)

watch(() => props.field, (val) => {
  if (val) {
    local.value = JSON.parse(JSON.stringify(val))
  } else {
    local.value = null
  }
}, { immediate: true })

/** 防抖同步变更到父组件 */
let syncTimer: ReturnType<typeof setTimeout> | null = null
function syncToParent(path: string, value: any) {
  if (!local.value) return
  // 立即更新本地
  const keys = path.split('.')
  let target: any = local.value
  for (let i = 0; i < keys.length - 1; i++) {
    if (!target[keys[i]]) target[keys[i]] = {}
    target = target[keys[i]]
  }
  target[keys[keys.length - 1]] = value

  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    if (!local.value) return
    // 构建 patch
    const patch: any = {}
    let t: any = patch
    for (let i = 0; i < keys.length - 1; i++) {
      t[keys[i]] = {}
      t = t[keys[i]]
    }
    t[keys[keys.length - 1]] = value
    emit('update', local.value._vid, patch)
  }, 200)
}

/** 即时同步 */
function syncImmediate(path: string, value: any) {
  if (!local.value) return
  if (syncTimer) { clearTimeout(syncTimer); syncTimer = null }

  const keys = path.split('.')
  let target: any = local.value
  for (let i = 0; i < keys.length - 1; i++) {
    if (!target[keys[i]]) target[keys[i]] = {}
    target = target[keys[i]]
  }
  target[keys[keys.length - 1]] = value

  const patch: any = {}
  let t: any = patch
  for (let i = 0; i < keys.length - 1; i++) {
    t[keys[i]] = {}
    t = t[keys[i]]
  }
  t[keys[keys.length - 1]] = value
  emit('update', local.value._vid, patch)
}

/** 组件定义 */
const componentDef = computed(() => {
  if (!local.value) return null
  return getFormComponent(local.value.componentKey) ?? null
})

/** 是否显示选项编辑 */
const showOptionsEditor = computed(() => {
  if (!local.value) return false
  return ['select', 'radio', 'checkbox', 'cascader'].includes(local.value.componentKey)
})

/** 选项编辑 */
function addOption() {
  if (!local.value) return
  if (!local.value.options) local.value.options = []
  local.value.options.push({ label: `选项${local.value.options.length + 1}`, value: `${local.value.options.length + 1}` })
  syncImmediate('options', [...local.value.options])
}

function removeOption(index: number) {
  if (!local.value?.options) return
  local.value.options.splice(index, 1)
  syncImmediate('options', [...local.value.options])
}

function onOptionChange(index: number, key: 'label' | 'value', val: string) {
  if (!local.value?.options) return
  local.value.options[index][key] = val
  syncImmediate('options', [...local.value.options])
}

/** 校验规则编辑 */
const ruleTypes = [
  { label: '必填', value: 'required' },
  { label: '最小值', value: 'min' },
  { label: '最大值', value: 'max' },
  { label: '最小长度', value: 'minLength' },
  { label: '最大长度', value: 'maxLength' },
  { label: '正则表达式', value: 'pattern' },
  { label: '邮箱格式', value: 'email' },
  { label: 'URL格式', value: 'url' },
  { label: '整数', value: 'integer' },
  { label: '浮点数', value: 'float' },
]

function addRule() {
  if (!local.value) return
  if (!local.value.rules) local.value.rules = []
  local.value.rules.push({ type: 'required', message: '此项为必填', trigger: 'blur' })
  syncImmediate('rules', [...local.value.rules])
}

function removeRule(index: number) {
  if (!local.value?.rules) return
  local.value.rules.splice(index, 1)
  syncImmediate('rules', [...local.value.rules])
}

function onRuleChange(index: number, key: string, val: any) {
  if (!local.value?.rules) return
  ;(local.value.rules[index] as any)[key] = val
  syncImmediate('rules', [...local.value.rules])
}

const colSpanOptions = [6, 8, 12, 16, 18, 24].map(v => ({ label: `${v}/24`, value: v }))

/* ========== 数据绑定 ========== */
const datasets = ref<ApiDatasetListItem[]>([])
const datasetLoading = ref(false)
const boundDatasetId = ref('')
const boundFieldName = ref('')

/** 选定数据集的字段列表 */
const datasetFields = ref<ApiDatasetField[]>([])
const fieldsLoading = ref(false)

/** 加载数据集列表 */
async function loadDatasets() {
  datasetLoading.value = true
  try {
    const list = await fetchAllDatasets()
    datasets.value = list
  } catch {
    // 静默失败
  } finally {
    datasetLoading.value = false
  }
}

/** 选择数据集后加载字段 */
async function onDatasetSelect(datasetId: string) {
  boundDatasetId.value = datasetId
  boundFieldName.value = ''
  datasetFields.value = []

  if (!datasetId) {
    if (local.value) {
      syncImmediate('datasetBinding', null)
    }
    return
  }

  fieldsLoading.value = true
  try {
    const detail = await fetchDatasetDetail(datasetId)
    datasetFields.value = detail.fields || []
  } catch {
    ElMessage.error('加载数据集字段失败')
  } finally {
    fieldsLoading.value = false
  }
}

/** 选择绑定字段 */
function onFieldBind(fieldName: string) {
  boundFieldName.value = fieldName
  if (fieldName && boundDatasetId.value) {
    syncImmediate('datasetBinding', {
      datasetId: boundDatasetId.value,
      field: fieldName,
    })
  } else {
    syncImmediate('datasetBinding', null)
  }
}

/** 清除绑定 */
function clearBinding() {
  boundDatasetId.value = ''
  boundFieldName.value = ''
  datasetFields.value = []
  if (local.value) {
    syncImmediate('datasetBinding', null)
  }
}

/** 同步本地绑定状态 */
function syncBindingFromField(field: FormField) {
  const binding = field.datasetBinding as { datasetId?: string; field?: string } | undefined
  if (binding?.datasetId) {
    boundDatasetId.value = binding.datasetId
    boundFieldName.value = binding.field || ''
    // 异步加载对应数据集的字段
    onDatasetSelect(binding.datasetId)
  } else {
    boundDatasetId.value = ''
    boundFieldName.value = ''
    datasetFields.value = []
  }
}

watch(() => props.field, (val) => {
  if (val) {
    syncBindingFromField(val)
  }
}, { immediate: true })

onMounted(() => {
  loadDatasets()
})
</script>

<template>
  <div class="form-field-settings flex h-full flex-col">
    <!-- 标题栏 -->
    <div class="flex items-center justify-between px-3 py-2 border-b border-[var(--el-border-color-light)]">
      <span class="text-sm font-semibold">字段属性</span>
      <el-tag v-if="componentDef" size="small" type="info">
        {{ componentDef.label }}
      </el-tag>
    </div>

    <!-- 无选中字段 -->
    <div v-if="!local" class="flex flex-1 items-center justify-center text-sm text-[var(--el-text-color-placeholder)]">
      请选择画布上的字段
    </div>

    <!-- 属性表单 -->
    <el-scrollbar v-else class="flex-1">
      <div class="px-3 py-2">
      <el-form label-position="top" size="small">
        <!-- 基础属性 -->
        <div class="mb-2 text-xs font-semibold text-[var(--el-text-color-secondary)]">基础属性</div>

        <el-form-item label="标签名">
          <el-input
            :model-value="local.label"
            placeholder="请输入标签名"
            @input="syncToParent('label', $event)"
          />
        </el-form-item>

        <el-form-item label="字段标识">
          <el-input
            :model-value="local.field"
            placeholder="数据字段名"
            @input="syncToParent('field', $event)"
          />
        </el-form-item>

        <el-form-item label="占位提示">
          <el-input
            :model-value="local.placeholder"
            placeholder="请输入占位提示"
            @input="syncToParent('placeholder', $event)"
          />
        </el-form-item>

        <el-form-item label="默认值">
          <el-input
            :model-value="local.defaultValue"
            placeholder="请输入默认值"
            @input="syncToParent('defaultValue', $event)"
          />
        </el-form-item>

        <!-- 布局属性 -->
        <div class="mb-2 mt-4 text-xs font-semibold text-[var(--el-text-color-secondary)]">布局属性</div>

        <el-form-item label="栅格宽度">
          <el-select
            :model-value="local.colSpan"
            @change="syncImmediate('colSpan', $event)"
          >
            <el-option
              v-for="opt in colSpanOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>

        <!-- 功能属性 -->
        <div class="mb-2 mt-4 text-xs font-semibold text-[var(--el-text-color-secondary)]">功能属性</div>

        <div class="mb-3 flex items-center justify-between">
          <span class="text-xs text-[var(--el-text-color-regular)]">必填</span>
          <el-switch
            :model-value="local.required"
            size="small"
            @change="syncImmediate('required', $event)"
          />
        </div>

        <div class="mb-3 flex items-center justify-between">
          <span class="text-xs text-[var(--el-text-color-regular)]">禁用</span>
          <el-switch
            :model-value="local.disabled"
            size="small"
            @change="syncImmediate('disabled', $event)"
          />
        </div>

        <div class="mb-3 flex items-center justify-between">
          <span class="text-xs text-[var(--el-text-color-regular)]">隐藏</span>
          <el-switch
            :model-value="local.hidden"
            size="small"
            @change="syncImmediate('hidden', $event)"
          />
        </div>

        <div class="mb-3 flex items-center justify-between">
          <span class="text-xs text-[var(--el-text-color-regular)]">只读</span>
          <el-switch
            :model-value="local.readonly"
            size="small"
            @change="syncImmediate('readonly', $event)"
          />
        </div>

        <!-- 数据绑定 -->
        <div class="mb-2 mt-4 text-xs font-semibold text-[var(--el-text-color-secondary)]">数据绑定</div>

        <el-form-item label="绑定数据集">
          <div class="flex items-center gap-1">
            <el-select
              :model-value="boundDatasetId"
              placeholder="选择数据集"
              size="small"
              clearable
              filterable
              class="flex-1"
              :loading="datasetLoading"
              @change="onDatasetSelect"
            >
              <el-option
                v-for="ds in datasets"
                :key="ds.id"
                :label="ds.name"
                :value="ds.id"
              />
            </el-select>
            <el-button size="small" text :icon="Refresh" :loading="datasetLoading" @click="loadDatasets" />
          </div>
        </el-form-item>

        <el-form-item v-if="boundDatasetId" label="绑定字段">
          <div class="flex items-center gap-1">
            <el-select
              :model-value="boundFieldName"
              placeholder="选择字段"
              size="small"
              clearable
              class="flex-1"
              :loading="fieldsLoading"
              @change="onFieldBind"
            >
              <el-option
                v-for="f in datasetFields"
                :key="f.name"
                :label="`${f.label || f.name} (${f.type})`"
                :value="f.name"
              />
            </el-select>
            <el-button size="small" text :icon="Delete" type="danger" @click="clearBinding" />
          </div>
          <div class="mt-1 text-xs text-[var(--el-text-color-placeholder)]">
            将字段值与数据集{{ boundFieldName ? `的"${boundFieldName}"字段` : '' }}关联
          </div>
        </el-form-item>

        <!-- 选项编辑（select/radio/checkbox） -->
        <template v-if="showOptionsEditor">
          <div class="mb-2 mt-4 flex items-center justify-between text-xs font-semibold text-[var(--el-text-color-secondary)]">
            <span>选项列表</span>
            <el-button size="small" text :icon="Plus" type="primary" @click="addOption">添加</el-button>
          </div>
          <div class="mb-2 space-y-1">
            <div
              v-for="(opt, idx) in local.options"
              :key="idx"
              class="flex items-center gap-1"
            >
              <el-input
                :model-value="opt.label"
                size="small"
                placeholder="标签"
                class="flex-1"
                @input="onOptionChange(idx, 'label', $event)"
              />
              <el-input
                :model-value="opt.value"
                size="small"
                placeholder="值"
                class="w-20"
                @input="onOptionChange(idx, 'value', $event)"
              />
              <el-button size="small" text :icon="Delete" type="danger" @click="removeOption(idx)" />
            </div>
          </div>
        </template>

        <!-- 校验规则 -->
        <div class="mb-2 mt-4 flex items-center justify-between text-xs font-semibold text-[var(--el-text-color-secondary)]">
          <span>校验规则</span>
          <el-button size="small" text :icon="Plus" type="primary" @click="addRule">添加</el-button>
        </div>
        <div class="space-y-2">
          <div
            v-for="(rule, idx) in local.rules"
            :key="idx"
            class="rounded border border-[var(--el-border-color-light)] p-2"
          >
            <div class="mb-1 flex items-center justify-between">
              <el-select
                :model-value="rule.type"
                size="small"
                class="flex-1"
                @change="onRuleChange(idx, 'type', $event)"
              >
                <el-option
                  v-for="rt in ruleTypes"
                  :key="rt.value"
                  :label="rt.label"
                  :value="rt.value"
                />
              </el-select>
              <el-button size="small" text :icon="Delete" type="danger" @click="removeRule(idx)" />
            </div>
            <el-input
              :model-value="rule.message"
              size="small"
              placeholder="错误提示信息"
              class="mb-1"
              @input="onRuleChange(idx, 'message', $event)"
            />
            <el-input
              v-if="!['required', 'email', 'url', 'integer', 'float'].includes(rule.type)"
              :model-value="rule.value"
              size="small"
              placeholder="校验值"
              @input="onRuleChange(idx, 'value', $event)"
            />
          </div>
        </div>
      </el-form>
      </div>
    </el-scrollbar>
  </div>
</template>

<style scoped>
.form-field-settings {
  min-width: 280px;
}
</style>
