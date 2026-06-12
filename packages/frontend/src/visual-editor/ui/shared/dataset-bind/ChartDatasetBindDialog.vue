<script setup lang="ts">
import type { ApiDatasetField, ApiDatasetListItem } from '@/api/dataset'
import type {
  BlockDatasetBindings,
  DatasetBindingFilter,
  DatasetPostCalcOp,
  DatasetValueOperation,
  PropDatasetBinding,
} from '@/utils/datasetBinding'
import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { ElAutoResizer, ElMessage } from 'element-plus'
import { computed, ref, watch } from 'vue'
import { fetchAllDatasets, fetchDatasetDetail } from '@/api/dataset'
import { AdaptiveDialog } from '@/components/adaptive-dialog'
import BarChartView from '@/packages/pc/chart-widgets/bar-chart/BarChartView'
import {
  CHART_DIMENSION_PROP,
  CHART_METRIC_PROP,
  CHART_VALUE_AGG_OPTIONS,
  DATASET_POST_CALC_OPTIONS,
  getChartBindings,
  syncChartPropsFromBindings,
} from '@/utils/datasetBinding'
import DatasetBindDropZone from './DatasetBindDropZone.vue'
import DatasetBindFilters from './DatasetBindFilters.vue'
import DatasetBindSplitterLayout from './DatasetBindSplitterLayout.vue'
import DatasetFieldList from './DatasetFieldList.vue'

const props = defineProps<{
  block: VisualEditorBlockData
}>()

const visible = defineModel<boolean>({ required: true })

const datasetId = ref('')
const datasets = ref<ApiDatasetListItem[]>([])
const fields = ref<ApiDatasetField[]>([])
const fieldsLoading = ref(false)
const pickerVisible = ref(false)

const dimensionField = ref<ApiDatasetField | null>(null)
const metricField = ref<ApiDatasetField | null>(null)
const filters = ref<DatasetBindingFilter[]>([])
const valueOp = ref<DatasetValueOperation>('sum')
const postCalcEnabled = ref(false)
const postCalcOp = ref<DatasetPostCalcOp>('add')
const postCalcOperand = ref(0)

const datasetName = computed(() => datasets.value.find(d => d.id === datasetId.value)?.name ?? '')

const datasourceActionLabel = computed(() =>
  datasetId.value ? '更改数据源' : '选择数据源',
)

const draftBindings = computed((): BlockDatasetBindings => {
  const base = { ...(props.block.datasetBindings ?? {}) }
  if (!datasetId.value.trim()) {
    return base
  }
  const sharedFilters = filters.value.length > 0 ? [...filters.value] : undefined
  if (dimensionField.value) {
    base[CHART_DIMENSION_PROP] = {
      datasetId: datasetId.value,
      dataType: 'scalar',
      field: dimensionField.value.name,
      filters: sharedFilters,
    }
  }
  if (metricField.value) {
    const metric: PropDatasetBinding = {
      datasetId: datasetId.value,
      dataType: 'scalar',
      field: metricField.value.name,
      filters: sharedFilters,
      valueOp: valueOp.value,
    }
    if (postCalcEnabled.value) {
      metric.postCalc = { op: postCalcOp.value, operand: postCalcOperand.value }
    }
    base[CHART_METRIC_PROP] = metric
  }
  return base
})

const canConfirm = computed(
  () =>
    Boolean(datasetId.value.trim() && dimensionField.value && metricField.value),
)

function findFieldByName(name: string): ApiDatasetField | null {
  return fields.value.find(f => f.name === name) ?? null
}

function syncFieldRefsFromBindings() {
  const { dimension, metric } = getChartBindings(props.block.datasetBindings)
  dimensionField.value = dimension?.field ? findFieldByName(dimension.field) : null
  metricField.value = metric?.field ? findFieldByName(metric.field) : null
}

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
    syncFieldRefsFromBindings()
  }
  catch {
    fields.value = []
  }
  finally {
    fieldsLoading.value = false
  }
}

function resetFromBlock() {
  const { dimension, metric } = getChartBindings(props.block.datasetBindings)
  datasetId.value = dimension?.datasetId?.trim() || metric?.datasetId?.trim() || ''
  filters.value = [...(dimension?.filters ?? metric?.filters ?? [])]
  valueOp.value = metric?.valueOp ?? 'sum'
  postCalcEnabled.value = Boolean(metric?.postCalc)
  postCalcOp.value = metric?.postCalc?.op ?? 'add'
  postCalcOperand.value = metric?.postCalc?.operand ?? 0
  dimensionField.value = null
  metricField.value = null

  if (datasetId.value) {
    void loadFields(datasetId.value)
  }
}

function ensureBindings() {
  if (!props.block.datasetBindings) {
    props.block.datasetBindings = {}
  }
  return props.block.datasetBindings
}

function applyToBlock() {
  const map = ensureBindings()
  const sharedFilters = filters.value.length > 0 ? [...filters.value] : undefined

  if (datasetId.value.trim() && dimensionField.value) {
    map[CHART_DIMENSION_PROP] = {
      datasetId: datasetId.value,
      dataType: 'scalar',
      field: dimensionField.value.name,
      filters: sharedFilters,
    }
  }
  else {
    delete map[CHART_DIMENSION_PROP]
  }

  if (datasetId.value.trim() && metricField.value) {
    const metric: PropDatasetBinding = {
      datasetId: datasetId.value,
      dataType: 'scalar',
      field: metricField.value.name,
      filters: sharedFilters,
      valueOp: valueOp.value,
    }
    if (postCalcEnabled.value) {
      metric.postCalc = { op: postCalcOp.value, operand: postCalcOperand.value }
    }
    map[CHART_METRIC_PROP] = metric
  }
  else {
    delete map[CHART_METRIC_PROP]
  }

  syncChartPropsFromBindings(props.block.props, map)
}

function onPickDataset(id: string) {
  datasetId.value = id
  pickerVisible.value = false
  dimensionField.value = null
  metricField.value = null
  filters.value = []
}

function onDimensionDrop(field: ApiDatasetField) {
  dimensionField.value = field
}

function onMetricDrop(field: ApiDatasetField) {
  metricField.value = field
}

function onConfirm() {
  if (!canConfirm.value) {
    return
  }
  applyToBlock()
  visible.value = false
}

function onClear() {
  const map = props.block.datasetBindings
  if (map) {
    delete map[CHART_DIMENSION_PROP]
    delete map[CHART_METRIC_PROP]
  }
  syncChartPropsFromBindings(props.block.props, map ?? {})
  visible.value = false
}

watch(visible, async (open) => {
  if (!open) {
    return
  }
  await loadDatasets()
  resetFromBlock()
})

watch(datasetId, (id) => {
  if (id) {
    void loadFields(id)
  }
  else {
    fields.value = []
    dimensionField.value = null
    metricField.value = null
  }
})

function chartSize(value: number, min: number) {
  return Math.max(value, min)
}
</script>

<template>
  <AdaptiveDialog
    v-model="visible"
    title="配置图表数据"
    width="min(1280px, 96vw)"
    drawer-size="min(720px, 92vw)"
    shell-class="chart-dataset-bind-dialog"
    dialog-body-height="66vh"
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
              <span class="section-head__title">字段映射</span>
              <el-tag size="small" type="info" effect="plain">
                维度 + 指标
              </el-tag>
            </div>
            <p class="bind-config__desc">
              从左侧拖动字段到维度或指标区域，分别对应图表 X 轴分类与 Y 轴数值。
            </p>
          </header>

          <div class="bind-config__body chart-bind-fields">
            <DatasetBindDropZone
              label="维度字段"
              :field="dimensionField"
              :active="Boolean(datasetId)"
              variant="dimension"
              empty-text="拖动字段到此处（X 轴 / 分类）"
              @drop-field="onDimensionDrop"
              @clear="dimensionField = null"
            />
            <DatasetBindDropZone
              label="指标字段"
              :field="metricField"
              :active="Boolean(datasetId)"
              variant="metric"
              empty-text="拖动字段到此处（Y 轴 / 数值）"
              @drop-field="onMetricDrop"
              @clear="metricField = null"
            />

            <span class="bind-config__label">维度聚合</span>
            <div class="bind-config__control">
              <el-select
                v-model="valueOp"
                size="default"
                class="bind-config__select"
                :disabled="!metricField"
              >
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
                同一维度出现多行时，按所选方式合并指标列
              </span>
            </div>

            <span class="bind-config__label">数值运算</span>
            <div class="bind-config__control bind-config__control--inline">
              <el-checkbox v-model="postCalcEnabled" :disabled="!metricField">
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

            <div class="bind-config__section chart-bind-filters">
              <div class="bind-config__section-title">
                筛选条件
              </div>
              <DatasetBindFilters v-model="filters" :fields="fields" :disabled="!datasetId" />
            </div>
          </div>
        </section>
      </template>

      <template #preview>
        <section class="chart-preview">
          <header class="section-head">
            <span class="section-head__title">图表预览</span>
            <span class="section-head__hint">配置后实时预览</span>
          </header>
          <div class="chart-preview__viewport">
            <div class="chart-preview__canvas">
              <ElAutoResizer>
                <template #default="{ width, height }">
                  <BarChartView
                    :bindings="draftBindings"
                    :bar-color="(block.props?.barColor as string) || '#409EFF'"
                    :use-sample-data="false"
                    :show-refresh="false"
                    :width="chartSize(width, 200)"
                    :height="chartSize(height, 120)"
                  />
                </template>
              </ElAutoResizer>
            </div>
          </div>
        </section>
      </template>
    </DatasetBindSplitterLayout>

    <template #footer>
      <el-button @click="visible = false">
        取消
      </el-button>
      <el-button type="danger" plain @click="onClear">
        清除绑定
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
  background: #fff;
}

.datasource-bar__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.datasource-bar__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.datasource-bar__action {
  font-size: 13px;
}

.datasource-bar__name {
  margin-top: 8px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.datasource-bar__name--empty {
  color: var(--el-text-color-placeholder);
}

.datasource-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.datasource-option:hover {
  background: var(--el-fill-color-light);
}

.datasource-option--active {
  background: var(--el-color-primary-light-9);
}

.datasource-option__name {
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.datasource-option__meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.bind-config {
  min-height: 0;
}

.bind-config__head {
  flex-shrink: 0;
  padding: 16px 20px 0;
}

.section-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.section-head__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.section-head__hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.bind-config__desc {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.chart-bind-fields {
  max-height: var(--chart-config-max-height, none);
}

.bind-config__body {
  padding: 12px 20px 16px;
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 12px 16px;
  align-items: start;
}

.bind-config__label {
  padding-top: 11px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  text-align: right;
  white-space: nowrap;
}

.bind-config__control {
  min-width: 0;
}

.bind-config__control--inline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.bind-config__select {
  width: 100%;
  max-width: 240px;
}

.bind-config__tips {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  line-height: 1.5;
}

.bind-config__section {
  grid-column: 1 / -1;
  margin-top: 4px;
}

.bind-config__section-title {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.chart-bind-filters {
  padding-top: 4px;
  border-top: 1px dashed var(--el-border-color-lighter);
}

.chart-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #fff;
}

.chart-preview .section-head {
  flex-shrink: 0;
  padding: 14px 20px 10px;
}

.chart-preview__viewport {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px 16px;
  overflow: hidden;
}

.chart-preview__canvas {
  aspect-ratio: 1;
  height: 100%;
  max-width: 100%;
  width: auto;
  flex-shrink: 0;
  overflow: hidden;
}

.chart-preview__canvas :deep(.el-auto-resizer) {
  width: 100%;
  height: 100%;
}
</style>
