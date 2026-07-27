<script lang="ts" setup>
import type { FormField } from '../../../types'
/**
 * 字段属性编辑面板
 * 选中字段后显示其可编辑属性，含数据绑定
 */
import type { ApiDatasetField, ApiDatasetListItem } from '@/api/dataset'
import { Delete, Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { fetchAllDatasets, fetchDatasetDetail } from '@/api/dataset'
import { getFormComponent } from '../../../form-component-registry'

const props = defineProps<{
  field: FormField | null
}>()

const emit = defineEmits<{
  (e: 'update', vid: string, patch: Partial<FormField>): void
}>()

function resolveDatasetFieldId(fieldIdOrName: string, fields: ApiDatasetField[]) {
  if (!fieldIdOrName)
    return ''
  if (fields.some(field => field.id === fieldIdOrName))
    return fieldIdOrName
  const matched = fields.find(field => field.name === fieldIdOrName)
  return matched?.id ?? fieldIdOrName
}

/** 本地编辑缓存 */
const local = ref<FormField | null>(null)

// 选中字段变化时全量更新
watch(
  () => props.field?._vid,
  (vid) => {
    if (vid && props.field) {
      local.value = JSON.parse(JSON.stringify(props.field))
    }
    else {
      local.value = null
    }
  },
  { immediate: true },
)

// 同一字段属性被外部（画布拖拽等）修改时，同步到本地
watch(
  () => props.field,
  (val) => {
    if (val && local.value?._vid === val._vid) {
      local.value = JSON.parse(JSON.stringify(val))
    }
  },
  { deep: true },
)

/** 防抖同步变更到父组件 */
let syncTimer: ReturnType<typeof setTimeout> | null = null
function syncToParent(path: string, value: any) {
  if (!local.value)
    return
  // 立即更新本地
  const keys = path.split('.')
  let target: any = local.value
  for (let i = 0; i < keys.length - 1; i++) {
    if (!target[keys[i]])
      target[keys[i]] = {}
    target = target[keys[i]]
  }
  target[keys[keys.length - 1]] = value

  if (syncTimer)
    clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    if (!local.value)
      return
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
  if (!local.value)
    return
  if (syncTimer) {
    clearTimeout(syncTimer)
    syncTimer = null
  }

  const keys = path.split('.')
  let target: any = local.value
  for (let i = 0; i < keys.length - 1; i++) {
    if (!target[keys[i]])
      target[keys[i]] = {}
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

const activeTab = ref<'properties' | 'binding'>('properties')

/** 组件定义 */
const componentDef = computed(() => {
  if (!local.value)
    return null
  return getFormComponent(local.value.componentKey) ?? null
})

/** 是否显示选项编辑 */
const showOptionsEditor = computed(() => {
  if (!local.value)
    return false
  return ['select', 'radio', 'checkbox', 'cascader'].includes(local.value.componentKey)
})

/** 选项编辑 */
function addOption() {
  if (!local.value)
    return
  if (!local.value.options)
    local.value.options = []
  local.value.options.push({
    label: `选项${local.value.options.length + 1}`,
    value: `${local.value.options.length + 1}`,
  })
  syncImmediate('options', [...local.value.options])
}

function removeOption(index: number) {
  if (!local.value?.options)
    return
  local.value.options.splice(index, 1)
  syncImmediate('options', [...local.value.options])
}

function onOptionChange(index: number, key: 'label' | 'value', val: string) {
  if (!local.value?.options)
    return
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
  if (!local.value)
    return
  if (!local.value.rules)
    local.value.rules = []
  local.value.rules.push({ type: 'required', message: '此项为必填', trigger: 'blur' })
  syncImmediate('rules', [...local.value.rules])
}

function removeRule(index: number) {
  if (!local.value?.rules)
    return
  local.value.rules.splice(index, 1)
  syncImmediate('rules', [...local.value.rules])
}

function onRuleChange(index: number, key: string, val: any) {
  if (!local.value?.rules)
    return;
  (local.value.rules[index] as any)[key] = val
  syncImmediate('rules', [...local.value.rules])
}

const colSpanOptions = Array.from({ length: 24 }, (_, index) => {
  const value = index + 1
  return { label: `${value}/24`, value }
})

/* ========== 数据绑定 ========== */
const datasets = ref<ApiDatasetListItem[]>([])
const datasetLoading = ref(false)
const boundDatasetId = ref('')
const boundFieldId = ref('')

/** 选定数据集的字段列表 */
const datasetFields = ref<ApiDatasetField[]>([])
const fieldsLoading = ref(false)

/** 加载数据集列表 */
async function loadDatasets() {
  datasetLoading.value = true
  try {
    const list = await fetchAllDatasets()
    datasets.value = list
  }
  catch {
    // 静默失败
  }
  finally {
    datasetLoading.value = false
  }
}

/** 选择数据集后加载字段 */
async function onDatasetSelect(datasetId: string, options?: { preserveField?: boolean }) {
  boundDatasetId.value = datasetId
  if (!options?.preserveField) {
    boundFieldId.value = ''
  }
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
    if (options?.preserveField && local.value?.datasetBinding) {
      const binding = local.value.datasetBinding as { datasetFieldId?: string, field?: string } | null
      boundFieldId.value = resolveDatasetFieldId(binding?.datasetFieldId || binding?.field || '', datasetFields.value)
    }
  }
  catch {
    ElMessage.error('加载数据集字段失败')
  }
  finally {
    fieldsLoading.value = false
  }
}

/** 选择绑定字段 */
function onFieldBind(fieldId: string) {
  boundFieldId.value = fieldId
  if (fieldId && boundDatasetId.value) {
    syncImmediate('datasetBinding', {
      datasetId: boundDatasetId.value,
      datasetFieldId: fieldId,
    })
  }
  else {
    syncImmediate('datasetBinding', null)
  }
}

/** 清除绑定 */
function clearBinding() {
  boundDatasetId.value = ''
  boundFieldId.value = ''
  datasetFields.value = []
  if (local.value) {
    syncImmediate('datasetBinding', null)
  }
}

/** 同步本地绑定状态 */
function syncBindingFromField(field: FormField) {
  const binding = field.datasetBinding as { datasetId?: string, datasetFieldId?: string, field?: string } | undefined
  if (binding?.datasetId) {
    boundDatasetId.value = binding.datasetId
    boundFieldId.value = resolveDatasetFieldId(binding.datasetFieldId || binding.field || '', datasetFields.value)
    // 异步加载对应数据集的字段，同时保留已绑定字段回显
    onDatasetSelect(binding.datasetId, { preserveField: true })
  }
  else {
    boundDatasetId.value = ''
    boundFieldId.value = ''
    datasetFields.value = []
  }
}

watch(
  () => props.field,
  (val) => {
    if (val) {
      syncBindingFromField(val)
    }
  },
  { immediate: true },
)

onMounted(() => {
  loadDatasets()
})

onBeforeUnmount(() => {
  if (syncTimer) {
    clearTimeout(syncTimer)
    syncTimer = null
  }
})
</script>

<template>
  <div class="form-field-settings flex h-full flex-col">
    <!-- 无选中字段 -->
    <div
      v-if="!local"
      class="flex flex-1 items-center justify-center text-sm text-[var(--el-text-color-placeholder)]"
    >
      请选择画布上的字段
    </div>

    <!-- 属性表单 -->
    <el-scrollbar v-else class="flex-1">
      <div class="p-3">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="字段属性" name="properties">
            <div class="mb-3 flex items-center justify-between">
              <span class="form-section-title">基础属性</span>
              <el-tag v-if="componentDef" type="info" effect="plain">
                {{ componentDef.label }}
              </el-tag>
            </div>

            <el-form label-position="top">
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

              <div class="form-section-title mb-2 mt-4">
                布局属性
              </div>

              <el-form-item label="栅格宽度">
                <el-select :model-value="local.colSpan" @change="syncImmediate('colSpan', $event)">
                  <el-option
                    v-for="opt in colSpanOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </el-form-item>

              <div class="form-section-title mb-2 mt-4">
                功能属性
              </div>

              <div class="mb-3 flex items-center justify-between">
                <span class="text-xs text-[var(--el-text-color-regular)]">必填</span>
                <el-switch
                  :model-value="local.required"
                  @change="syncImmediate('required', $event)"
                />
              </div>

              <div class="mb-3 flex items-center justify-between">
                <span class="text-xs text-[var(--el-text-color-regular)]">禁用</span>
                <el-switch
                  :model-value="local.disabled"
                  @change="syncImmediate('disabled', $event)"
                />
              </div>

              <div class="mb-3 flex items-center justify-between">
                <span class="text-xs text-[var(--el-text-color-regular)]">隐藏</span>
                <el-switch
                  :model-value="local.hidden"
                  @change="syncImmediate('hidden', $event)"
                />
              </div>

              <div class="mb-3 flex items-center justify-between">
                <span class="text-xs text-[var(--el-text-color-regular)]">只读</span>
                <el-switch
                  :model-value="local.readonly"
                  @change="syncImmediate('readonly', $event)"
                />
              </div>

              <div class="form-section-title mb-2 mt-4">
                表单项扩展（ElFormItem）
              </div>

              <el-form-item label="标签宽度 (px)">
                <el-input-number
                  :model-value="local.labelWidth"
                  :min="0"
                  :max="300"
                  :step="10"
                  placeholder="0 表示继承全局"
                  @change="syncImmediate('labelWidth', $event || undefined)"
                />
                <div class="mt-1 text-xs text-[var(--el-text-color-placeholder)]">
                  留空或 0 表示使用表单全局标签宽度
                </div>
              </el-form-item>

              <el-form-item label="尺寸">
                <el-select
                  :model-value="local.size || ''"
                  placeholder="继承全局"
                  clearable
                  @change="syncImmediate('size', $event || undefined)"
                >
                  <el-option label="大" value="large" />
                  <el-option label="默认" value="default" />
                  <el-option label="小" value="small" />
                </el-select>
                <div class="mt-1 text-xs text-[var(--el-text-color-placeholder)]">
                  不选则继承表单全局尺寸
                </div>
              </el-form-item>

              <div class="mb-3 flex items-center justify-between">
                <span class="text-xs text-[var(--el-text-color-regular)]">显示校验信息</span>
                <el-switch
                  :model-value="local.showMessage"
                  @change="syncImmediate('showMessage', $event ?? undefined)"
                />
              </div>

              <el-form-item label="自定义错误信息">
                <el-input
                  :model-value="local.error"
                  placeholder="留空则使用校验规则中的提示"
                  @input="syncToParent('error', $event || undefined)"
                />
              </el-form-item>

              <!-- 选项编辑（select/radio/checkbox） -->
              <template v-if="showOptionsEditor">
                <div class="form-section-title mb-2 mt-4 flex items-center justify-between">
                  <span>选项列表</span>
                  <el-button text :icon="Plus" type="primary" @click="addOption">
                    添加
                  </el-button>
                </div>
                <div class="mb-2 space-y-1">
                  <div v-for="(opt, idx) in local.options" :key="idx" class="flex items-center gap-1">
                    <el-input
                      :model-value="opt.label"
                      placeholder="标签"
                      class="flex-1"
                      @input="onOptionChange(idx, 'label', $event)"
                    />
                    <el-input
                      :model-value="opt.value"
                      placeholder="值"
                      class="w-20"
                      @input="onOptionChange(idx, 'value', $event)"
                    />
                    <el-button
                      text
                      :icon="Delete"
                      type="danger"
                      @click="removeOption(idx)"
                    />
                  </div>
                </div>
              </template>

              <!-- 校验规则 -->
              <div class="form-section-title mb-2 mt-4 flex items-center justify-between">
                <span>校验规则</span>
                <el-button text :icon="Plus" type="primary" @click="addRule">
                  添加
                </el-button>
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
                    <el-button
                      text
                      :icon="Delete"
                      type="danger"
                      @click="removeRule(idx)"
                    />
                  </div>
                  <el-input
                    :model-value="rule.message"
                    placeholder="错误提示信息"
                    class="mb-1"
                    @input="onRuleChange(idx, 'message', $event)"
                  />
                  <el-input
                    v-if="!['required', 'email', 'url', 'integer', 'float'].includes(rule.type)"
                    :model-value="rule.value"
                    placeholder="校验值"
                    @input="onRuleChange(idx, 'value', $event)"
                  />
                </div>
              </div>
            </el-form>
          </el-tab-pane>

          <el-tab-pane label="数据绑定" name="binding">
            <div class="space-y-4 pt-2">
              <div class="text-xs text-[var(--el-text-color-placeholder)]">
                将表单字段绑定到数据集字段，字段绑定会在保存时一并持久化。
              </div>

              <el-form label-position="top">
                <el-form-item label="绑定数据集">
                  <div class="flex items-center gap-1">
                    <el-select
                      :model-value="boundDatasetId"
                      placeholder="选择数据集"
                      clearable
                      filterable
                      class="flex-1 w-[155px]"
                      :loading="datasetLoading"
                      @change="onDatasetSelect"
                    >
                      <el-option v-for="ds in datasets" :key="ds.id" :label="ds.name" :value="ds.id" />
                    </el-select>
                    <el-button
                      text
                      :icon="Refresh"
                      :loading="datasetLoading"
                      @click="loadDatasets"
                    />
                  </div>
                </el-form-item>

                <el-form-item v-if="boundDatasetId" label="绑定字段">
                  <div class="flex items-center gap-1">
                    <el-select
                      :model-value="boundFieldId"
                      placeholder="选择字段"
                      clearable
                      class="flex-1"
                      :loading="fieldsLoading"
                      @change="onFieldBind"
                    >
                      <el-option
                        v-for="f in datasetFields"
                        :key="f.id"
                        :label="`${f.name} (${f.field_type})`"
                        :value="f.id"
                      />
                    </el-select>
                    <el-button text :icon="Delete" type="danger" @click="clearBinding" />
                  </div>
                  <div class="mt-1 text-xs text-[var(--el-text-color-placeholder)]">
                    将字段值与数据集{{ boundFieldId ? `的字段ID(${boundFieldId})` : "" }}关联
                  </div>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-scrollbar>
  </div>
</template>

<style scoped>
.form-field-settings {
  min-width: 280px;
  height: 100%;
}
</style>
