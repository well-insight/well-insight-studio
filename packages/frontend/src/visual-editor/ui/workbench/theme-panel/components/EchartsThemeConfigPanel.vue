<script setup lang="ts">
import type { CanvasTheme } from '@/common/types/canvasTheme'
import type { EChartsThemeData } from '@/common/types/echartsTheme'
import { ref } from 'vue'
import { onThemePaletteChange } from '@/common/utils/themeBridge'
import { updateAxisSetting } from '@/common/utils/echartsThemeDefaults'
import ThemeColorField from './ThemeColorField.vue'
import ThemeColorListField from './ThemeColorListField.vue'

const echartsTheme = defineModel<EChartsThemeData>('echartsTheme', { required: true })
const canvasTheme = defineModel<CanvasTheme>('canvasTheme', { required: true })

const activeNames = ref(['basic'])

const symbolOptions = [
  { label: '空心圆', value: 'emptyCircle' },
  { label: '实心圆', value: 'circle' },
  { label: '矩形', value: 'rect' },
  { label: '空心矩形', value: 'emptyRect' },
  { label: '圆角矩形', value: 'roundRect' },
  { label: '空心圆角矩形', value: 'emptyRoundRect' },
  { label: '三角形', value: 'triangle' },
  { label: '空心三角形', value: 'emptyTriangle' },
  { label: '菱形', value: 'diamond' },
  { label: '空心菱形', value: 'emptyDiamond' },
  { label: '图钉', value: 'pin' },
  { label: '空心图钉', value: 'emptyPin' },
  { label: '箭头', value: 'arrow' },
  { label: '空心箭头', value: 'emptyArrow' },
]

const gridLeft = ref(String(echartsTheme.value.gridLeft))
const gridRight = ref(String(echartsTheme.value.gridRight))
const gridTop = ref(String(echartsTheme.value.gridTop))
const gridBottom = ref(String(echartsTheme.value.gridBottom))
const legendLeft = ref(String(echartsTheme.value.legendLeft))
const legendRight = ref(String(echartsTheme.value.legendRight))
const legendTop = ref(String(echartsTheme.value.legendTop))
const legendBottom = ref(String(echartsTheme.value.legendBottom))

function onAxisSettingChange() {
  updateAxisSetting(echartsTheme.value)
}

function validateGridValue(position: 'left' | 'right' | 'top' | 'bottom') {
  const valueRef = { left: gridLeft, right: gridRight, top: gridTop, bottom: gridBottom }[position]
  const inputValue = valueRef.value.trim()
  const isValid = inputValue === ''
    || /^\d+$/.test(inputValue)
    || /^\d+(?:\.\d+)?%$/.test(inputValue)

  if (isValid) {
    const finalValue = inputValue === ''
      ? (position === 'left' || position === 'right' ? '10%' : 60)
      : (/^\d+$/.test(inputValue) ? Number.parseInt(inputValue, 10) : inputValue)
    const key = `grid${position.charAt(0).toUpperCase()}${position.slice(1)}` as keyof EChartsThemeData
    ;(echartsTheme.value as Record<string, unknown>)[key] = finalValue
  }
  else {
    const defaultValue = position === 'left' || position === 'right' ? '10%' : 60
    valueRef.value = String(defaultValue)
    const key = `grid${position.charAt(0).toUpperCase()}${position.slice(1)}` as keyof EChartsThemeData
    ;(echartsTheme.value as Record<string, unknown>)[key] = defaultValue
  }
}

function validateLegendValue(position: 'left' | 'right' | 'top' | 'bottom') {
  const valueRef = { left: legendLeft, right: legendRight, top: legendTop, bottom: legendBottom }[position]
  const inputValue = valueRef.value.trim()
  const isValid = inputValue === ''
    || /^\d+$/.test(inputValue)
    || /^\d+(?:\.\d+)?%$/.test(inputValue)
    || ['auto', 'center', 'left', 'right', 'top', 'bottom'].includes(inputValue)

  if (isValid) {
    const finalValue = inputValue === ''
      ? (position === 'bottom' ? 10 : position === 'left' ? 'center' : 'auto')
      : (/^\d+$/.test(inputValue) ? Number.parseInt(inputValue, 10) : inputValue)
    const key = `legend${position.charAt(0).toUpperCase()}${position.slice(1)}` as keyof EChartsThemeData
    ;(echartsTheme.value as Record<string, unknown>)[key] = finalValue
  }
  else {
    const defaultValue = position === 'left' ? 'center' : position === 'bottom' ? 10 : 'auto'
    valueRef.value = String(defaultValue)
    const key = `legend${position.charAt(0).toUpperCase()}${position.slice(1)}` as keyof EChartsThemeData
    ;(echartsTheme.value as Record<string, unknown>)[key] = defaultValue
  }
}

function onThemeColorsChange(colors: string[]) {
  const prev = [...echartsTheme.value.color]
  echartsTheme.value.color = colors
  onThemePaletteChange(canvasTheme.value, prev, colors)
}

const axisTypeLabels: Record<string, string> = {
  category: '类目轴',
  value: '数值轴',
  log: '对数轴',
  time: '时间轴',
}

interface CanvasColorItem {
  label: string
  path: string
  isText?: boolean
}

interface CanvasColorGroup {
  label: string
  items: CanvasColorItem[]
}

const canvasColorGroups: CanvasColorGroup[] = [
  {
    label: '文字色',
    items: [
      { label: '主要文字', path: 'text.primary' },
      { label: '常规文字', path: 'text.regular' },
      { label: '次要文字', path: 'text.secondary' },
      { label: '占位文字', path: 'text.placeholder' },
      { label: '禁用文字', path: 'text.disabled' },
    ],
  },
  {
    label: '背景色',
    items: [
      { label: '页面背景', path: 'bg.page' },
      { label: '组件背景', path: 'bg.component' },
      { label: '叠加背景', path: 'bg.overlay' },
      { label: '悬停背景', path: 'bg.hover' },
      { label: '选中背景', path: 'bg.selected' },
    ],
  },
  {
    label: '边框色',
    items: [
      { label: '基础边框', path: 'border.base' },
      { label: '浅色边框', path: 'border.light' },
      { label: '深色边框', path: 'border.dark' },
    ],
  },
  {
    label: '填充色',
    items: [
      { label: '默认填充', path: 'fill.default' },
      { label: '浅填充', path: 'fill.light' },
      { label: '深填充', path: 'fill.dark' },
      { label: '页面填充', path: 'fill.page' },
    ],
  },
  {
    label: '阴影',
    items: [
      { label: '浅阴影', path: 'shadow.light', isText: true },
      { label: '中等阴影', path: 'shadow.medium', isText: true },
      { label: '深阴影', path: 'shadow.dark', isText: true },
    ],
  },
]

function getCanvasVal(path: string): string {
  const keys = path.split('.')
  let val: unknown = canvasTheme.value
  for (const k of keys) val = (val as Record<string, unknown>)?.[k]
  return typeof val === 'string' ? val : ''
}

function setCanvasVal(path: string, value: string) {
  const keys = path.split('.')
  let target: Record<string, unknown> = canvasTheme.value as unknown as Record<string, unknown>
  for (let i = 0; i < keys.length - 1; i++) {
    if (!target[keys[i]!])
      target[keys[i]!] = {}
    target = target[keys[i]!] as Record<string, unknown>
  }
  target[keys[keys.length - 1]!] = value
}
</script>

<template>
  <el-collapse v-model="activeNames" class="echarts-config-collapse">
    <!-- 基本配置 -->
    <el-collapse-item title="基本配置" name="basic">
      <div class="config-section">
        <el-form label-width="90px" label-position="left" size="small">
          <div class="config-subtitle">
            图表
          </div>
          <el-form-item label="背景色">
            <ThemeColorField v-model="echartsTheme.backgroundColor" />
          </el-form-item>
          <el-form-item label="标题色">
            <ThemeColorField v-model="echartsTheme.titleColor" />
          </el-form-item>
          <el-form-item label="副标题色">
            <ThemeColorField v-model="echartsTheme.subtitleColor" />
          </el-form-item>
          <el-form-item label="主题色板">
            <ThemeColorListField
              :model-value="echartsTheme.color"
              v-model:theme="canvasTheme"
              show-index
              show-brand-mapping
              @update:model-value="onThemeColorsChange"
            />
          </el-form-item>
          <el-form-item label="标注文字">
            <ThemeColorField v-model="echartsTheme.markTextColor" />
          </el-form-item>
          <el-form-item label="边框宽度">
            <el-input-number v-model="echartsTheme.borderWidth" :min="0" :max="10" size="small" />
          </el-form-item>
          <el-form-item label="边框颜色">
            <ThemeColorField v-model="echartsTheme.borderColor" />
          </el-form-item>

          <div
            v-for="group in canvasColorGroups"
            :key="group.label"
            class="canvas-color-group"
          >
            <div class="config-subtitle">
              {{ group.label }}
            </div>
            <el-form-item
              v-for="item in group.items"
              :key="item.path"
              :label="item.label"
            >
              <el-input
                v-if="item.isText"
                :model-value="getCanvasVal(item.path)"
                size="small"
                @update:model-value="(v) => setCanvasVal(item.path, v as string)"
              />
              <ThemeColorField
                v-else
                :model-value="getCanvasVal(item.path)"
                @update:model-value="setCanvasVal(item.path, $event)"
              />
            </el-form-item>
          </div>
        </el-form>
      </div>
    </el-collapse-item>

    <!-- 视觉映射 -->
    <el-collapse-item title="视觉映射" name="visualMap">
      <div class="config-section">
        <el-form label-width="90px" size="small">
          <el-form-item label="映射色板">
            <ThemeColorListField v-model="echartsTheme.visualMapColor" />
          </el-form-item>
        </el-form>
      </div>
    </el-collapse-item>

    <!-- Grid 布局 -->
    <el-collapse-item title="Grid 布局" name="grid">
      <div class="config-section">
        <el-form label-width="60px" size="small">
          <el-form-item label="左">
            <el-input v-model="gridLeft" @blur="validateGridValue('left')" />
          </el-form-item>
          <el-form-item label="右">
            <el-input v-model="gridRight" @blur="validateGridValue('right')" />
          </el-form-item>
          <el-form-item label="上">
            <el-input v-model="gridTop" @blur="validateGridValue('top')" />
          </el-form-item>
          <el-form-item label="下">
            <el-input v-model="gridBottom" @blur="validateGridValue('bottom')" />
          </el-form-item>
        </el-form>
      </div>
    </el-collapse-item>

    <!-- 坐标轴 -->
    <el-collapse-item title="坐标轴" name="axis">
      <div class="config-section">
        <el-checkbox v-model="echartsTheme.axisSeperateSetting" @change="onAxisSettingChange">
          分别设置各轴
        </el-checkbox>
        <div
          v-for="(axis, index) in echartsTheme.axis"
          :key="index"
          class="axis-group"
        >
          <div v-if="axis.type !== 'all'" class="axis-group__title">
            {{ axisTypeLabels[axis.type] || axis.name }}
          </div>
          <el-form label-width="80px" size="small">
            <el-form-item label="轴线">
              <ThemeColorField
                v-model="axis.axisLineColor"
                can-disable
                :enabled="axis.axisLineShow"
                @update:enabled="axis.axisLineShow = $event"
              />
            </el-form-item>
            <el-form-item label="刻度线">
              <ThemeColorField
                v-model="axis.axisTickColor"
                can-disable
                :enabled="axis.axisTickShow"
                @update:enabled="axis.axisTickShow = $event"
              />
            </el-form-item>
            <el-form-item label="分割线">
              <ThemeColorListField
                v-model="axis.splitLineColor"
                can-disable
                :enabled="axis.splitLineShow"
                @update:enabled="axis.splitLineShow = $event"
              />
            </el-form-item>
            <el-form-item label="分割区域">
              <ThemeColorListField
                v-model="axis.splitAreaColor"
                can-disable
                :enabled="axis.splitAreaShow"
                @update:enabled="axis.splitAreaShow = $event"
              />
            </el-form-item>
            <el-form-item label="轴标签">
              <ThemeColorField
                v-model="axis.axisLabelColor"
                can-disable
                :enabled="axis.axisLabelShow"
                @update:enabled="axis.axisLabelShow = $event"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>
    </el-collapse-item>

    <!-- 图例 -->
    <el-collapse-item title="图例" name="legend">
      <div class="config-section">
        <el-form label-width="80px" size="small">
          <el-form-item label="文字颜色">
            <ThemeColorField v-model="echartsTheme.legendTextColor" />
          </el-form-item>
          <div class="config-subtitle">
            图例位置
          </div>
          <el-form-item label="左">
            <el-input v-model="legendLeft" @blur="validateLegendValue('left')" />
          </el-form-item>
          <el-form-item label="右">
            <el-input v-model="legendRight" @blur="validateLegendValue('right')" />
          </el-form-item>
          <el-form-item label="上">
            <el-input v-model="legendTop" @blur="validateLegendValue('top')" />
          </el-form-item>
          <el-form-item label="下">
            <el-input v-model="legendBottom" @blur="validateLegendValue('bottom')" />
          </el-form-item>
        </el-form>
      </div>
    </el-collapse-item>

    <!-- 工具箱 -->
    <el-collapse-item title="工具箱" name="toolbox">
      <div class="config-section">
        <el-form label-width="90px" size="small">
          <el-form-item label="图标颜色">
            <ThemeColorField v-model="echartsTheme.toolboxColor" />
          </el-form-item>
          <el-form-item label="高亮颜色">
            <ThemeColorField v-model="echartsTheme.toolboxEmphasisColor" />
          </el-form-item>
        </el-form>
      </div>
    </el-collapse-item>

    <!-- 提示框 -->
    <el-collapse-item title="提示框" name="tooltip">
      <div class="config-section">
        <el-form label-width="90px" size="small">
          <el-form-item label="指示线颜色">
            <ThemeColorField v-model="echartsTheme.tooltipAxisColor" />
          </el-form-item>
          <el-form-item label="指示线宽度">
            <el-input-number v-model="echartsTheme.tooltipAxisWidth" :min="1" :max="10" size="small" />
          </el-form-item>
        </el-form>
      </div>
    </el-collapse-item>

    <!-- 时间轴 -->
    <el-collapse-item title="时间轴" name="timeline">
      <div class="config-section">
        <el-form label-width="100px" size="small">
          <el-form-item label="节点颜色">
            <ThemeColorField v-model="echartsTheme.timelineItemColor" />
          </el-form-item>
          <el-form-item label="节点高亮">
            <ThemeColorField v-model="echartsTheme.timelineItemColorE" />
          </el-form-item>
          <el-form-item label="选中颜色">
            <ThemeColorField v-model="echartsTheme.timelineCheckColor" />
          </el-form-item>
          <el-form-item label="选中边框">
            <ThemeColorField v-model="echartsTheme.timelineCheckBorderColor" />
          </el-form-item>
          <el-form-item label="节点边框宽">
            <el-input-number v-model="echartsTheme.timelineItemBorderWidth" :min="0" :max="5" size="small" />
          </el-form-item>
          <el-form-item label="主轴颜色">
            <ThemeColorField v-model="echartsTheme.timelineLineColor" />
          </el-form-item>
          <el-form-item label="主轴宽度">
            <el-input-number v-model="echartsTheme.timelineLineWidth" :min="1" :max="10" size="small" />
          </el-form-item>
          <el-form-item label="控件填充">
            <ThemeColorField v-model="echartsTheme.timelineControlColor" />
          </el-form-item>
          <el-form-item label="控件边框">
            <ThemeColorField v-model="echartsTheme.timelineControlBorderColor" />
          </el-form-item>
          <el-form-item label="控件边框宽">
            <el-input-number v-model="echartsTheme.timelineControlBorderWidth" :min="0" :max="5" size="small" />
          </el-form-item>
          <el-form-item label="标签颜色">
            <ThemeColorField v-model="echartsTheme.timelineLabelColor" />
          </el-form-item>
        </el-form>
      </div>
    </el-collapse-item>

    <!-- 折线图 -->
    <el-collapse-item title="折线图" name="line">
      <div class="config-section">
        <el-form label-width="90px" size="small">
          <el-form-item label="平滑曲线">
            <el-switch v-model="echartsTheme.lineSmooth" />
          </el-form-item>
          <el-form-item label="线宽">
            <el-input-number v-model="echartsTheme.lineWidth" :min="1" :max="10" size="small" />
          </el-form-item>
          <el-form-item label="标记边框">
            <el-input-number v-model="echartsTheme.symbolBorderWidth" :min="0" :max="5" size="small" />
          </el-form-item>
          <el-form-item label="标记大小">
            <el-input-number v-model="echartsTheme.symbolSize" :min="1" :max="20" size="small" />
          </el-form-item>
          <el-form-item label="标记形状">
            <el-select v-model="echartsTheme.symbol" size="small" style="width: 100%">
              <el-option v-for="opt in symbolOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
    </el-collapse-item>

    <!-- 关系图 -->
    <el-collapse-item title="关系图" name="graph">
      <div class="config-section">
        <el-form label-width="80px" size="small">
          <el-form-item label="线宽">
            <el-input-number v-model="echartsTheme.graphLineWidth" :min="1" :max="10" size="small" />
          </el-form-item>
          <el-form-item label="线颜色">
            <ThemeColorField v-model="echartsTheme.graphLineColor" />
          </el-form-item>
        </el-form>
      </div>
    </el-collapse-item>

    <!-- 地图 -->
    <el-collapse-item title="地图" name="map">
      <div class="config-section">
        <el-form label-width="90px" size="small">
          <el-form-item label="区域颜色">
            <ThemeColorField v-model="echartsTheme.mapAreaColor" />
          </el-form-item>
          <el-form-item label="边框颜色">
            <ThemeColorField v-model="echartsTheme.mapBorderColor" />
          </el-form-item>
          <el-form-item label="边框宽度">
            <el-input-number v-model="echartsTheme.mapBorderWidth" :min="0" :max="5" :step="0.5" size="small" />
          </el-form-item>
          <el-form-item label="标签颜色">
            <ThemeColorField v-model="echartsTheme.mapLabelColor" />
          </el-form-item>
          <el-form-item label="区域高亮">
            <ThemeColorField v-model="echartsTheme.mapAreaColorE" />
          </el-form-item>
          <el-form-item label="边框高亮">
            <ThemeColorField v-model="echartsTheme.mapBorderColorE" />
          </el-form-item>
          <el-form-item label="高亮边框宽">
            <el-input-number v-model="echartsTheme.mapBorderWidthE" :min="0" :max="5" :step="0.5" size="small" />
          </el-form-item>
          <el-form-item label="标签高亮">
            <ThemeColorField v-model="echartsTheme.mapLabelColorE" />
          </el-form-item>
        </el-form>
      </div>
    </el-collapse-item>

    <!-- K线图 -->
    <el-collapse-item title="K线图" name="kline">
      <div class="config-section">
        <el-form label-width="90px" size="small">
          <el-form-item label="上涨颜色">
            <ThemeColorField v-model="echartsTheme.kColor" />
          </el-form-item>
          <el-form-item label="下跌颜色">
            <ThemeColorField v-model="echartsTheme.kColor0" />
          </el-form-item>
          <el-form-item label="上涨边框">
            <ThemeColorField v-model="echartsTheme.kBorderColor" />
          </el-form-item>
          <el-form-item label="下跌边框">
            <ThemeColorField v-model="echartsTheme.kBorderColor0" />
          </el-form-item>
          <el-form-item label="边框宽度">
            <el-input-number v-model="echartsTheme.kBorderWidth" :min="0" :max="5" size="small" />
          </el-form-item>
        </el-form>
      </div>
    </el-collapse-item>
  </el-collapse>
</template>

<style scoped>
.echarts-config-collapse {
  border: none;
}

.echarts-config-collapse :deep(.el-collapse-item) {
  margin-bottom: 8px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-fill-color-lighter);
}

.echarts-config-collapse :deep(.el-collapse-item__header) {
  font-size: 13px;
  font-weight: 600;
  height: 36px;
  padding: 0 12px;
  border: none;
  background: transparent;
  transition: background-color 0.2s;
}

.echarts-config-collapse :deep(.el-collapse-item__header:hover) {
  background-color: var(--el-color-primary-light-9);
}

.echarts-config-collapse :deep(.el-collapse-item__wrap) {
  border: none;
  background: transparent;
}

.echarts-config-collapse :deep(.el-collapse-item__content) {
  padding: 0 8px 8px;
}

.config-section {
  padding: 4px 4px 0;
}

.config-section :deep(.el-form-item) {
  margin-bottom: 12px;
}

.config-section :deep(.el-form-item__label) {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.config-section :deep(.el-form-item__content) {
  flex-wrap: nowrap;
}

.canvas-color-group {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--el-border-color-lighter);
}

.config-subtitle {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-placeholder);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 6px 0 4px;
  padding-left: 2px;
}

.axis-group {
  margin-top: 10px;
  padding: 10px 6px 4px;
  background: var(--el-bg-color);
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
}

.axis-group__title {
  font-size: 12px;
  font-weight: 500;
  color: var(--el-color-primary);
  margin-bottom: 6px;
  padding-left: 2px;
}
</style>
