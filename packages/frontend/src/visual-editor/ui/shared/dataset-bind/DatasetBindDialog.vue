<script setup lang="ts">
import type { ApiDatasetField, ApiDatasetListItem } from '@/api/dataset'
import type {
  DatasetBindingDataType,
  DatasetBindingFilter,
  DatasetPostCalcOp,
  DatasetValueOperation,
  PropDatasetBinding,
} from '@/utils/datasetBinding'
import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { ElMessage } from 'element-plus'
import { computed, ref, watch } from 'vue'
import { fetchAllDatasets, fetchDatasetDetail } from '@/api/dataset'
import { AdaptiveDialog } from '@/components/adaptive-dialog'
import {
  CHART_VALUE_AGG_OPTIONS,
  DATASET_POST_CALC_OPTIONS,
  DATASET_VALUE_OP_OPTIONS,
  getBindingTypeLabel,
  getPropValueType,
  inferBindingDataType,
} from '@/utils/datasetBinding'
import DatasetBindBlockPreview from './DatasetBindBlockPreview.vue'
import DatasetBindDropZone from './DatasetBindDropZone.vue'
import DatasetBindFilters from './DatasetBindFilters.vue'
import DatasetBindSplitterLayout from './DatasetBindSplitterLayout.vue'
import DatasetFieldList from './DatasetFieldList.vue'

const props = defineProps<{
  block: VisualEditorBlockData
  propName: string
  propLabel?: string
  allowListMode?: boolean
  initialBinding?: PropDatasetBinding | null
}>()

const emit = defineEmits<{
  confirm: [binding: PropDatasetBinding]
  clear: []
}>()

const visible = defineModel<boolean>({ required: true })

const datasetId = ref('')
const datasets = ref<ApiDatasetListItem[]>([])
const fields = ref<ApiDatasetField[]>([])
const fieldsLoading = ref(false)
const pickerVisible = ref(false)

const boundField = ref<ApiDatasetField | null>(null)
const labelField = ref<ApiDatasetField | null>(null)
const rowIndex = ref(0)
const valueOp = ref<DatasetValueOperation>('cell')
const filters = ref<DatasetBindingFilter[]>([])
const listDistinct = ref(false)
const postCalcEnabled = ref(false)
const postCalcOp = ref<DatasetPostCalcOp>('add')
const postCalcOperand = ref(0)

const isChartCategory = computed(() => props.propName === 'categoryField')
const isChartValue = computed(() => props.propName === 'valueField')
const isChartField = computed(() => isChartCategory.value || isChartValue.value)

const bindingDataType = computed((): DatasetBindingDataType =>
  inferBindingDataType(props.propName, Boolean(props.allowListMode), isChartField.value),
)

const bindingTypeLabel = computed(() =>
  getBindingTypeLabel(bindingDataType.value, isChartField.value),
)

const isListMode = computed(() => bindingDataType.value === 'list')
const isScalarMode = computed(() => bindingDataType.value === 'scalar')

const isNumericTarget = computed(
  () => getPropValueType(props.block.componentKey, props.propName) === 'number',
)

const valueOpOptions = computed(() =>
  DATASET_VALUE_OP_OPTIONS.filter(o => !o.numeric || isNumericTarget.value),
)

const showRowIndex = computed(
  () => isScalarMode.value && !isChartField.value && valueOp.value === 'cell',
)

const showPostCalc = computed(
  () =>
    (isScalarMode.value && !isChartField.value && isNumericTarget.value) || isChartValue.value,
)

const showNumericAgg = computed(() => isScalarMode.value && isNumericTarget.value)

const datasetName = computed(() => {
  const id = datasetId.value
  return datasets.value.find(d => d.id === id)?.name ?? ''
})

const datasourceActionLabel = computed(() =>
  datasetId.value ? '更改数据源' : '选择数据源',
)

const draftBinding = computed((): PropDatasetBinding | null => {
  if (!datasetId.value.trim() || !boundField.value) {
    return null
  }
  const b: PropDatasetBinding = {
    datasetId: datasetId.value,
    dataType: bindingDataType.value,
    field: boundField.value.name,
    filters: filters.value.length > 0 ? [...filters.value] : undefined,
  }

  if (isListMode.value) {
    b.labelField = (labelField.value ?? boundField.value)!.name
    if (listDistinct.value) {
      b.listDistinct = true
    }
  }
  else if (isChartValue.value) {
    b.valueOp = valueOp.value
    if (postCalcEnabled.value) {
      b.postCalc = { op: postCalcOp.value, operand: postCalcOperand.value }
    }
  }
  else if (!isChartCategory.value) {
    b.valueOp = valueOp.value
    if (valueOp.value === 'cell') {
      b.rowIndex = rowIndex.value
    }
    if (showPostCalc.value && postCalcEnabled.value) {
      b.postCalc = { op: postCalcOp.value, operand: postCalcOperand.value }
    }
  }

  return b
})

const canConfirm = computed(() => Boolean(draftBinding.value))

const scalarFieldLabel = computed(() => {
  if (isChartCategory.value) {
    return '维度字段'
  }
  if (isChartValue.value) {
    return '指标字段'
  }
  return `绑定到「${props.propLabel || props.propName}」`
})

async function loadDatasets() {
  try {
    const list = await fetchAllDatasets()
    datasets.value = Array.isArray(list) ? list : []
  }
  catch (e) {
    datasets.value = []
    ElMessage.error(e instanceof Error ? e.message : '加载数据集失败')
  }
}

async function loadFields(id: string) {
  if (!id) {
    fields.value = []
    return
  }
  fieldsLoading.value = true
  try {
    const detail = await fetchDatasetDetail(id)
    fields.value = detail.fields ?? []
    syncFieldRefsFromNames()
  }
  catch {
    fields.value = []
  }
  finally {
    fieldsLoading.value = false
  }
}

function findFieldByName(name: string): ApiDatasetField | null {
  return fields.value.find(f => f.name === name) ?? null
}

function syncFieldRefsFromNames() {
  const b = props.initialBinding
  if (!b) {
    return
  }
  boundField.value = findFieldByName(b.field)
  labelField.value = b.labelField ? findFieldByName(b.labelField) : null
}

function resetFromBinding(b: PropDatasetBinding | null | undefined) {
  datasetId.value = b?.datasetId ?? ''
  rowIndex.value = b?.rowIndex ?? 0
  valueOp.value = b?.valueOp ?? (props.propName === 'valueField' ? 'sum' : 'cell')
  filters.value = b?.filters ? [...b.filters] : []
  listDistinct.value = Boolean(b?.listDistinct)
  postCalcEnabled.value = Boolean(b?.postCalc)
  postCalcOp.value = b?.postCalc?.op ?? 'add'
  postCalcOperand.value = b?.postCalc?.operand ?? 0
  boundField.value = null
  labelField.value = null

  if (datasetId.value) {
    void loadFields(datasetId.value).then(() => {
      if (b?.field) {
        boundField.value = findFieldByName(b.field)
      }
      if (b?.labelField) {
        labelField.value = findFieldByName(b.labelField)
      }
    })
  }
}

watch(visible, async (open) => {
  if (!open) {
    return
  }
  await loadDatasets()
  resetFromBinding(props.initialBinding)
})

watch(datasetId, (id) => {
  if (id) {
    void loadFields(id)
  }
  else {
    fields.value = []
    boundField.value = null
    labelField.value = null
  }
})

function onPickDataset(id: string) {
  datasetId.value = id
  pickerVisible.value = false
}

function onLabelDrop(field: ApiDatasetField) {
  labelField.value = field
}

function onValueDrop(field: ApiDatasetField) {
  boundField.value = field
}

function onConfirm() {
  const d = draftBinding.value
  if (!d) {
    return
  }
  emit('confirm', d)
  visible.value = false
}

function onClear() {
  emit('clear')
  visible.value = false
}
</script>

<template>
  <AdaptiveDialog
    v-model="visible"
    :title="`绑定数据源${propLabel ? ` · ${propLabel}` : ''}`"
    width="min(1280px, 96vw)"
    drawer-size="min(720px, 92vw)"
    shell-class="dataset-bind-dialog"
    :close-on-click-modal="false"
  >
    <DatasetBindSplitterLayout>
      <template #aside>
        <div class="datasource-bar">
          <div class="datasource-bar__top">
            <span class="datasource-bar__label">数据源</span>
            <el-popover
              v-model:visible="pickerVisible"
              placement="bottom-start"
              :width="300"
              trigger="click"
              popper-class="dataset-picker-popover"
            >
              <template #reference>
                <el-button link type="primary" class="datasource-bar__action">
                  {{ datasourceActionLabel }}
                </el-button>
              </template>
              <el-scrollbar max-height="300px">
                <div
                  v-for="ds in datasets"
                  :key="ds.id"
                  class="datasource-option"
                  :class="{ 'datasource-option--active': ds.id === datasetId }"
                  @click="onPickDataset(ds.id)"
                >
                  <span class="datasource-option__name">{{ ds.name }}</span>
                  <span class="datasource-option__meta">{{ ds.row_count }} 行</span>
                </div>
                <el-empty v-if="datasets.length === 0" :image-size="48" description="暂无数据集" />
              </el-scrollbar>
            </el-popover>
          </div>
          <div class="datasource-bar__name" :class="{ 'datasource-bar__name--empty': !datasetName }">
            {{ datasetName || "请选择数据源" }}
          </div>
        </div>
        <div class="bind-aside-fields">
          <DatasetFieldList
            :fields="fields"
            :loading="fieldsLoading"
            :class="{ 'opacity-50 pointer-events-none': !datasetId }"
          />
        </div>
      </template>

      <template #config>
        <section class="bind-config">
          <header class="bind-config__head">
            <div class="section-head">
              <span class="section-head__title">数据绑定</span>
              <el-tag size="small" type="info" effect="plain">
                {{ bindingTypeLabel }}
              </el-tag>
            </div>
            <p class="bind-config__desc">
              <template v-if="isListMode">
                将数据集每行映射为「显示文字 + 绑定值」，适用于下拉框、单选、复选等选项类属性。
              </template>
              <template v-else-if="isChartField">
                绑定图表序列字段，取筛选后全部行的对应列作为维度或指标。
              </template>
              <template v-else>
                从数据集取单个值，支持指定行、聚合计算与数值运算。
              </template>
            </p>
          </header>

          <div class="bind-config__body">
            <!-- 键值对列表 -->
            <template v-if="isListMode">
              <DatasetBindDropZone
                label="显示字段"
                :field="labelField"
                active
                variant="dimension"
                empty-text="拖动字段到此处作为显示文字"
                @drop-field="onLabelDrop"
                @clear="labelField = null"
              />
              <DatasetBindDropZone
                label="绑定字段"
                :field="boundField"
                active
                variant="metric"
                empty-text="拖动字段到此处作为绑定值"
                @drop-field="onValueDrop"
                @clear="boundField = null"
              />
              <span class="bind-config__label">列表处理</span>
              <div class="bind-config__control">
                <el-checkbox v-model="listDistinct">
                  按绑定值去重
                </el-checkbox>
              </div>
            </template>

            <!-- 单值 / 图表字段 -->
            <template v-else>
              <DatasetBindDropZone
                :label="scalarFieldLabel"
                :field="boundField"
                active
                :variant="isChartField ? (isChartCategory ? 'dimension' : 'metric') : 'bind'"
                empty-text="拖动左侧字段到此处"
                @drop-field="onValueDrop"
                @clear="boundField = null"
              />

              <template v-if="isChartValue">
                <span class="bind-config__label">维度聚合</span>
                <div class="bind-config__control">
                  <el-select v-model="valueOp" size="default" class="bind-config__select">
                    <el-option
                      v-for="opt in CHART_VALUE_AGG_OPTIONS"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </div>
                <span class="bind-config__label" />
                <div class="bind-config__control">
                  <span class="bind-config__tips">
                    同一维度出现多行时，按所选方式合并「{{ boundField?.name || '指标' }}」列
                  </span>
                </div>

                <span class="bind-config__label">数值运算</span>
                <div class="bind-config__control bind-config__control--inline">
                  <el-checkbox v-model="postCalcEnabled">
                    启用
                  </el-checkbox>
                  <template v-if="postCalcEnabled">
                    <el-select v-model="postCalcOp" size="default" style="width: 88px">
                      <el-option
                        v-for="opt in DATASET_POST_CALC_OPTIONS"
                        :key="opt.value"
                        :label="opt.label"
                        :value="opt.value"
                      />
                    </el-select>
                    <el-input-number
                      v-model="postCalcOperand"
                      size="default"
                      controls-position="right"
                      :step="1"
                    />
                  </template>
                </div>
              </template>

              <template v-if="isScalarMode && !isChartField">
                <span class="bind-config__label">取值方式</span>
                <div class="bind-config__control">
                  <el-select v-model="valueOp" size="default" class="bind-config__select">
                    <el-option
                      v-for="opt in valueOpOptions"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </div>

                <template v-if="showRowIndex">
                  <span class="bind-config__label">数据行</span>
                  <div class="bind-config__control bind-config__control--inline">
                    <el-input-number
                      v-model="rowIndex"
                      :min="0"
                      :step="1"
                      size="default"
                      controls-position="right"
                    />
                    <span class="bind-config__tips">从 0 开始，取该行的字段值</span>
                  </div>
                </template>

                <template v-if="showPostCalc">
                  <span class="bind-config__label">数值运算</span>
                  <div class="bind-config__control bind-config__control--inline">
                    <el-checkbox v-model="postCalcEnabled">
                      启用
                    </el-checkbox>
                    <template v-if="postCalcEnabled">
                      <el-select v-model="postCalcOp" size="default" style="width: 88px">
                        <el-option
                          v-for="opt in DATASET_POST_CALC_OPTIONS"
                          :key="opt.value"
                          :label="opt.label"
                          :value="opt.value"
                        />
                      </el-select>
                      <el-input-number
                        v-model="postCalcOperand"
                        size="default"
                        controls-position="right"
                        :step="1"
                      />
                    </template>
                  </div>
                </template>

                <template v-if="showNumericAgg && valueOp !== 'cell'">
                  <span class="bind-config__label" />
                  <div class="bind-config__control">
                    <span class="bind-config__tips">
                      对筛选后的行在「{{ boundField?.name || '字段' }}」列上做{{ valueOpOptions.find((o) => o.value === valueOp)?.label }}
                    </span>
                  </div>
                </template>
              </template>
            </template>

            <div class="bind-config__section">
              <div class="bind-config__section-title">
                筛选条件
              </div>
              <DatasetBindFilters v-model="filters" :fields="fields" :disabled="!datasetId" />
            </div>
          </div>
        </section>
      </template>

      <template #preview>
        <DatasetBindBlockPreview
          :block="block"
          :prop-name="propName"
          :draft="draftBinding"
          column
        />
      </template>
    </DatasetBindSplitterLayout>

    <template #footer>
      <el-button @click="visible = false">
        取消
      </el-button>
      <el-button type="danger" plain @click="onClear">
        解除绑定
      </el-button>
      <el-button type="primary" :disabled="!canConfirm" @click="onConfirm">
        确定
      </el-button>
    </template>
  </AdaptiveDialog>
</template>

<style scoped>
.bind-aside-fields {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.datasource-bar {
  flex-shrink: 0;
  padding: 14px 16px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.datasource-bar__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.datasource-bar__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.datasource-bar__action {
  font-size: 13px;
  padding: 0;
  height: auto;
}

.datasource-bar__name {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.datasource-bar__name--empty {
  font-size: 13px;
  font-weight: 400;
  color: var(--el-text-color-placeholder);
}

.datasource-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  margin: 2px 4px;
  cursor: pointer;
  font-size: 13px;
  border-radius: 8px;
  transition: background 0.15s;
}

.datasource-option:hover {
  background: var(--el-fill-color-light);
}

.datasource-option--active {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.datasource-option__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.datasource-option__meta {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.bind-config {
  min-height: 0;
}

.bind-config__head {
  padding: 14px 20px 0;
}

.section-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-head__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.bind-config__desc {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.bind-config__body {
  display: grid;
  grid-template-columns: max-content 1fr;
  column-gap: 16px;
  row-gap: 14px;
  align-items: start;
  padding: 14px 20px 18px;
}

.bind-config__label {
  padding-top: 8px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  text-align: right;
  white-space: nowrap;
  justify-self: end;
}

.bind-config__label--section {
  padding-top: 10px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.bind-config__section {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
  padding-top: 12px;
  border-top: 1px dashed var(--el-border-color-lighter);
}

.bind-config__section-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.bind-config__control {
  min-width: 0;
}

.bind-config__control--inline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.bind-config__select {
  width: min(100%, 280px);
}

.bind-config__tips {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.bind-config__body :deep(.drop-row) {
  display: contents;
}
</style>

<style>
.dataset-picker-popover {
  padding: 8px 4px !important;
}
</style>
