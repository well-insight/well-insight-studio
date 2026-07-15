<script setup lang="ts">
import {
  Check,
  CopyDocument,
  Delete,
  InfoFilled,
  Moon,
  Plus,
  Sunny,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref, watch } from 'vue'
// ==================== 类型定义 ====================
export interface ShadowLayer {
  id: string
  x: number
  y: number
  blur: number
  spread: number
  color: string
  inset: boolean
}

export interface ShadowPreset {
  id: string
  name: string
  category: string
  description?: string
  layers: Omit<ShadowLayer, 'id'>[] // 预设中不含 id，动态生成
}

// ==================== Props & Emits ====================
const props = withDefaults(defineProps<{
  modelValue?: string
  customPresets?: ShadowPreset[]
  showPresets?: boolean
  showCustomPanel?: boolean
  showPreview?: boolean
  showCodeOutput?: boolean
  /** 属性面板等窄场景：紧凑布局，自定义区默认折叠 */
  compact?: boolean
  previewBg?: string
  previewText?: string
}>(), {
  modelValue: '',
  customPresets: () => [],
  showPresets: true,
  showCustomPanel: true,
  showPreview: true,
  showCodeOutput: true,
  compact: false,
  previewBg: '#f5f7fa',
  previewText: '预览区域',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
  (e: 'layer-update', layers: ShadowLayer[]): void
}>()

// ==================== 默认预设数据 ====================
const DEFAULT_PRESETS: ShadowPreset[] = [
  {
    id: 'card-default',
    name: '卡片默认',
    category: '组件卡片',
    description: '低代码组件默认阴影',
    layers: [
      { x: 0, y: 1, blur: 2, spread: 1, color: 'rgba(6, 30, 53, 0.1)', inset: false },
    ],
  },
  {
    id: 'material-1',
    name: 'Material 轻微',
    category: 'Material Design',
    description: '微妙的浮起感，适合卡片',
    layers: [
      { x: 0, y: 1, blur: 3, spread: 0, color: 'rgba(0, 0, 0, 0.08)', inset: false },
      { x: 0, y: 1, blur: 2, spread: -1, color: 'rgba(0, 0, 0, 0.05)', inset: false },
    ],
  },
  {
    id: 'material-2',
    name: 'Material 标准',
    category: 'Material Design',
    description: '标准卡片阴影',
    layers: [
      { x: 0, y: 3, blur: 6, spread: -1, color: 'rgba(0, 0, 0, 0.1)', inset: false },
      { x: 0, y: 2, blur: 4, spread: -2, color: 'rgba(0, 0, 0, 0.06)', inset: false },
    ],
  },
  {
    id: 'material-3',
    name: 'Material 浮起',
    category: 'Material Design',
    description: '明显的浮起效果',
    layers: [
      { x: 0, y: 8, blur: 16, spread: -4, color: 'rgba(0, 0, 0, 0.12)', inset: false },
      { x: 0, y: 4, blur: 8, spread: -2, color: 'rgba(0, 0, 0, 0.08)', inset: false },
    ],
  },
  {
    id: 'subtle-1',
    name: '极简微影',
    category: '常用',
    description: '几乎不可见的微妙阴影',
    layers: [{ x: 0, y: 1, blur: 2, spread: 0, color: 'rgba(0, 0, 0, 0.04)', inset: false }],
  },
  {
    id: 'standard-1',
    name: '标准阴影',
    category: '常用',
    description: '最常用的卡片阴影',
    layers: [{ x: 0, y: 4, blur: 12, spread: 0, color: 'rgba(0, 0, 0, 0.08)', inset: false }],
  },
  {
    id: 'tailwind-sm',
    name: 'Tailwind sm',
    category: '常用',
    description: 'TailwindCSS 小阴影',
    layers: [{ x: 0, y: 1, blur: 2, spread: 0, color: 'rgba(0, 0, 0, 0.05)', inset: false }],
  },
  {
    id: 'tailwind-md',
    name: 'Tailwind md',
    category: '常用',
    description: 'TailwindCSS 中等阴影',
    layers: [
      { x: 0, y: 4, blur: 6, spread: -1, color: 'rgba(0, 0, 0, 0.07)', inset: false },
      { x: 0, y: 2, blur: 4, spread: -2, color: 'rgba(0, 0, 0, 0.05)', inset: false },
    ],
  },
  {
    id: 'inset-1',
    name: '轻微内凹',
    category: '内阴影',
    description: '微妙的凹陷效果',
    layers: [{ x: 0, y: 2, blur: 4, spread: 0, color: 'rgba(0, 0, 0, 0.06)', inset: true }],
  },
  {
    id: 'inset-2',
    name: '标准内阴影',
    category: '内阴影',
    description: '明显的凹陷效果',
    layers: [{ x: 0, y: 4, blur: 8, spread: 0, color: 'rgba(0, 0, 0, 0.1)', inset: true }],
  },
  {
    id: 'color-1',
    name: '蓝色光晕',
    category: '彩色',
    description: '蓝色主题的发光阴影',
    layers: [{ x: 0, y: 4, blur: 16, spread: 0, color: 'rgba(59, 130, 246, 0.3)', inset: false }],
  },
]

// ==================== 工具函数 ====================
function generateId(): string {
  return `layer_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function splitByCommaOutsideParens(str: string): string[] {
  const result: string[] = []
  let depth = 0
  let current = ''
  for (const ch of str) {
    if (ch === '(')
      depth++
    if (ch === ')')
      depth--
    if (ch === ',' && depth === 0) {
      result.push(current.trim())
      current = ''
    }
    else {
      current += ch
    }
  }
  if (current.trim())
    result.push(current.trim())
  return result
}

function parseSingleLayer(str: string): ShadowLayer | null {
  let s = str.trim()
  let inset = false
  const insetRegex = /^inset\s+/i
  if (insetRegex.test(s)) {
    inset = true
    s = s.replace(insetRegex, '')
  }
  const colorRegex = /(rgba?\s*\([^)]+\)|hsla?\s*\([^)]+\)|#[a-f0-9]{3,8}|[a-z]+)(?:\s*$|$)/i
  let color = 'rgba(0, 0, 0, 0.1)'
  const colorMatch = s.match(colorRegex)
  if (colorMatch) {
    color = colorMatch[1]
    s = s.replace(colorMatch[1], '').trim()
  }
  const parts = s.trim().split(/\s+/).filter(Boolean)
  const nums = parts.map(p => Number.parseFloat(p)).filter(n => !isNaN(n))
  const x = nums[0] || 0
  const y = nums[1] || 0
  const blur = nums[2] || 0
  const spread = nums[3] || 0
  return { id: generateId(), x, y, blur, spread, color, inset }
}

function parseBoxShadow(css: string): ShadowLayer[] {
  if (!css || css.trim() === '' || css.trim() === 'none') {
    return [{ id: generateId(), x: 0, y: 4, blur: 12, spread: 0, color: 'rgba(0, 0, 0, 0.08)', inset: false }]
  }
  const parts = splitByCommaOutsideParens(css)
  const layers: ShadowLayer[] = []
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed)
      continue
    const layer = parseSingleLayer(trimmed)
    if (layer)
      layers.push(layer)
  }
  if (layers.length === 0) {
    return [{ id: generateId(), x: 0, y: 4, blur: 12, spread: 0, color: 'rgba(0, 0, 0, 0.08)', inset: false }]
  }
  return layers
}

function serializeBoxShadow(layers: ShadowLayer[]): string {
  if (!layers || layers.length === 0)
    return 'none'
  return layers
    .map(l => `${l.inset ? 'inset ' : ''}${l.x}px ${l.y}px ${l.blur}px ${l.spread}px ${l.color}`)
    .join(', ')
}

function layersEqual(a: ShadowLayer[], b: Omit<ShadowLayer, 'id'>[]): boolean {
  if (a.length !== b.length)
    return false
  return serializeBoxShadow(a) === serializeBoxShadow(b as ShadowLayer[])
}

// ==================== 响应式状态 ====================
const presets = computed<ShadowPreset[]>(() => {
  if (props.customPresets && props.customPresets.length > 0) {
    return props.customPresets
  }
  return DEFAULT_PRESETS
})

const categories = computed<string[]>(() => {
  const cats = [...new Set(presets.value.map(p => p.category))]
  return ['全部', ...cats]
})

const activeCategory = ref<string>('全部')
const customExpanded = ref(!props.compact)
const selectedPresetId = ref<string | null>(null)
const layers = ref<ShadowLayer[]>([])
const activeLayerIndex = ref<number>(0)
const isCustomizing = ref<boolean>(false)

const currentBoxShadow = computed<string>(() => serializeBoxShadow(layers.value))

const activeLayer = computed<ShadowLayer | null>(() => {
  if (layers.value.length === 0)
    return null
  const idx = Math.min(activeLayerIndex.value, layers.value.length - 1)
  return layers.value[idx] || layers.value[0]
})

const filteredPresets = computed<ShadowPreset[]>(() => {
  if (activeCategory.value === '全部')
    return presets.value
  return presets.value.filter(p => p.category === activeCategory.value)
})

const layerCount = computed<number>(() => layers.value.length)

// ==================== 初始化 ====================
function initFromModelValue() {
  const parsed = parseBoxShadow(props.modelValue)
  layers.value = parsed
  let matched = false
  for (const preset of presets.value) {
    if (layersEqual(parsed, preset.layers)) {
      selectedPresetId.value = preset.id
      matched = true
      break
    }
  }
  if (!matched) {
    selectedPresetId.value = null
    isCustomizing.value = true
  }
  activeLayerIndex.value = 0
}

watch(() => props.modelValue, (newVal) => {
  if (newVal !== currentBoxShadow.value) {
    initFromModelValue()
  }
}, { immediate: true })

onMounted(() => {
  if (layers.value.length === 0) {
    initFromModelValue()
  }
  if (layers.value.length === 0 && presets.value.length > 0) {
    selectPreset(presets.value[0])
  }
})

// ==================== 事件处理 ====================
function selectPreset(preset: ShadowPreset) {
  selectedPresetId.value = preset.id
  isCustomizing.value = false
  layers.value = preset.layers.map(l => ({ ...l, id: generateId() }))
  activeLayerIndex.value = 0
  emitUpdate()
}

function selectCategory(cat: string) {
  activeCategory.value = cat
}

function markAsCustom() {
  selectedPresetId.value = null
  isCustomizing.value = true
}

function updateLayerProperty(index: number, prop: keyof ShadowLayer, value: any) {
  markAsCustom()
  const newLayers = [...layers.value]
    ;(newLayers[index] as any)[prop] = value
  layers.value = newLayers
  emitUpdate()
}

function addLayer() {
  markAsCustom()
  const newLayer: ShadowLayer = {
    id: generateId(),
    x: 0,
    y: 4,
    blur: 8,
    spread: 0,
    color: 'rgba(0, 0, 0, 0.1)',
    inset: false,
  }
  layers.value = [...layers.value, newLayer]
  activeLayerIndex.value = layers.value.length - 1
  emitUpdate()
}

function removeLayer(index: number) {
  if (layers.value.length <= 1) {
    ElMessage.warning('至少保留一个阴影层')
    return
  }
  markAsCustom()
  const newLayers = layers.value.filter((_, i) => i !== index)
  layers.value = newLayers
  if (activeLayerIndex.value >= newLayers.length) {
    activeLayerIndex.value = newLayers.length - 1
  }
  emitUpdate()
}

function selectLayer(index: number) {
  activeLayerIndex.value = index
}

function resetToDefault() {
  if (presets.value.length > 0) {
    selectPreset(presets.value[0])
  }
}

function emitUpdate() {
  const val = currentBoxShadow.value
  emit('update:modelValue', val)
  emit('change', val)
  emit('layer-update', [...layers.value])
}

async function copyShadow() {
  try {
    await navigator.clipboard.writeText(`box-shadow: ${currentBoxShadow.value};`)
    ElMessage.success('CSS 已复制到剪贴板')
  }
  catch {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = `box-shadow: ${currentBoxShadow.value};`
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    ElMessage.success('CSS 已复制到剪贴板')
  }
}

function layerLabel(layer: ShadowLayer, index: number): string {
  const insetStr = layer.inset ? 'inset ' : ''
  return `层 ${index + 1}: ${insetStr}${layer.x}px ${layer.y}px ${layer.blur}px ${layer.spread}px`
}

function presetPreviewStyle(preset: ShadowPreset) {
  return {
    boxShadow: serializeBoxShadow(preset.layers as ShadowLayer[]),
    transition: 'box-shadow 0.25s ease, transform 0.25s ease',
  }
}
</script>

<template>
  <div class="bsp-container" :class="{ 'bsp-container--compact': compact }">
    <!-- 预设选择区域 -->
    <div v-if="showPresets && presets.length > 0" class="bsp-section bsp-presets-section">
      <div class="bsp-section-header">
        <span class="bsp-section-title">
          <el-icon><Sunny /></el-icon> 预设样式
        </span>
        <el-tag v-if="selectedPresetId" type="success" size="small" effect="plain">
          {{ presets.find(p => p.id === selectedPresetId)?.name || '已选择' }}
        </el-tag>
        <el-tag v-else-if="isCustomizing" type="warning" size="small" effect="plain">
          自定义
        </el-tag>
      </div>
      <!-- 分类标签 -->
      <div class="bsp-categories">
        <el-scrollbar class="bsp-categories-scroll" always>
          <div class="bsp-category-list">
            <span
              v-for="cat in categories"
              :key="cat"
              class="bsp-category-tag"
              :class="{ 'is-active': activeCategory === cat }"
              @click="selectCategory(cat)"
            >
              {{ cat }}
            </span>
          </div>
        </el-scrollbar>
      </div>
      <!-- 预设卡片网格 -->
      <el-scrollbar class="bsp-preset-scroll" :max-height="compact ? 220 : 320">
        <div class="bsp-preset-grid">
          <div
            v-for="preset in filteredPresets"
            :key="preset.id"
            class="bsp-preset-card"
            :class="{ 'is-selected': selectedPresetId === preset.id }"
            @click="selectPreset(preset)"
          >
            <div class="bsp-preset-preview" :style="presetPreviewStyle(preset)">
              <span class="bsp-preset-preview-dot" />
            </div>
            <div class="bsp-preset-info">
              <span class="bsp-preset-name">{{ preset.name }}</span>
              <el-tooltip v-if="preset.description" :content="preset.description" placement="top">
                <el-icon class="bsp-preset-info-icon">
                  <InfoFilled />
                </el-icon>
              </el-tooltip>
            </div>
            <div v-if="selectedPresetId === preset.id" class="bsp-preset-check">
              <el-icon><Check /></el-icon>
            </div>
          </div>
          <el-empty v-if="filteredPresets.length === 0" description="暂无预设" :image-size="60" />
        </div>
      </el-scrollbar>
    </div>

    <!-- 实时预览区域 -->
    <div v-if="showPreview" class="bsp-section bsp-preview-section">
      <div class="bsp-section-header">
        <span class="bsp-section-title">
          <el-icon><Moon /></el-icon> 实时预览
        </span>
        <span class="bsp-layer-count">共 {{ layerCount }} 层阴影</span>
      </div>
      <div
        class="bsp-preview-block"
        :style="{
          boxShadow: currentBoxShadow,
          backgroundColor: previewBg,
        }"
      >
        <span class="bsp-preview-text">{{ previewText }}</span>
      </div>
    </div>

    <!-- 自定义调节面板 -->
    <div v-if="showCustomPanel" class="bsp-section bsp-custom-section">
      <div
        class="bsp-section-header"
        :class="{ 'bsp-section-header--clickable': compact }"
        @click="compact && (customExpanded = !customExpanded)"
      >
        <span class="bsp-section-title">⚙️ 自定义调节</span>
        <div class="bsp-section-header-actions">
          <el-button v-if="compact" size="small" text type="primary">
            {{ customExpanded ? "收起" : "展开" }}
          </el-button>
          <el-button v-else size="small" text type="primary" @click.stop="resetToDefault">
            恢复默认
          </el-button>
        </div>
      </div>

      <el-scrollbar
        v-show="!compact || customExpanded"
        class="bsp-custom-scroll"
        :max-height="compact ? 280 : 360"
      >
        <div class="bsp-custom-body">
          <!-- 图层标签页 -->
          <el-scrollbar class="bsp-layer-tabs-scroll" always>
            <div class="bsp-layer-tabs">
              <div
                v-for="(layer, index) in layers"
                :key="layer.id"
                class="bsp-layer-tab"
                :class="{ 'is-active': activeLayerIndex === index }"
                @click="selectLayer(index)"
              >
                <span class="bsp-layer-tab-label">{{ layerLabel(layer, index) }}</span>
                <el-popconfirm
                  v-if="layers.length > 1"
                  title="确定删除此层？"
                  confirm-button-text="删除"
                  cancel-button-text="取消"
                  @confirm="removeLayer(index)"
                  @click.stop
                >
                  <template #reference>
                    <span class="bsp-layer-tab-close" @click.stop>
                      <el-icon><Delete /></el-icon>
                    </span>
                  </template>
                </el-popconfirm>
              </div>
              <el-button size="small" circle type="primary" plain class="bsp-add-layer-btn" @click="addLayer">
                <el-icon><Plus /></el-icon>
              </el-button>
            </div>
          </el-scrollbar>

          <!-- 当前图层参数调节 -->
          <div v-if="activeLayer" class="bsp-params">
            <div class="bsp-param-row">
              <label class="bsp-param-label">水平偏移 X</label>
              <div class="bsp-param-control">
                <el-slider
                  :model-value="activeLayer.x"
                  :min="-60"
                  :max="60"
                  :step="1"
                  show-input
                  size="small"
                  @update:model-value="(val: number) => updateLayerProperty(activeLayerIndex, 'x', val)"
                />
              </div>
            </div>
            <div class="bsp-param-row">
              <label class="bsp-param-label">垂直偏移 Y</label>
              <div class="bsp-param-control">
                <el-slider
                  :model-value="activeLayer.y"
                  :min="-60"
                  :max="60"
                  :step="1"
                  show-input
                  size="small"
                  @update:model-value="(val: number) => updateLayerProperty(activeLayerIndex, 'y', val)"
                />
              </div>
            </div>
            <div class="bsp-param-row">
              <label class="bsp-param-label">模糊半径 Blur</label>
              <div class="bsp-param-control">
                <el-slider
                  :model-value="activeLayer.blur"
                  :min="0"
                  :max="100"
                  :step="1"
                  show-input
                  size="small"
                  @update:model-value="(val: number) => updateLayerProperty(activeLayerIndex, 'blur', val)"
                />
              </div>
            </div>
            <div class="bsp-param-row">
              <label class="bsp-param-label">扩展半径 Spread</label>
              <div class="bsp-param-control">
                <el-slider
                  :model-value="activeLayer.spread"
                  :min="-30"
                  :max="30"
                  :step="1"
                  show-input
                  size="small"
                  @update:model-value="(val: number) => updateLayerProperty(activeLayerIndex, 'spread', val)"
                />
              </div>
            </div>
            <div class="bsp-param-row bsp-param-row--inline">
              <label class="bsp-param-label">阴影颜色</label>
              <div class="bsp-param-control bsp-param-control--color">
                <el-color-picker
                  :model-value="activeLayer.color"
                  show-alpha
                  size="small"
                  teleported
                  @update:model-value="(val: string) => updateLayerProperty(activeLayerIndex, 'color', val)"
                />
                <span class="bsp-color-text">{{ activeLayer.color }}</span>
              </div>
            </div>
            <div class="bsp-param-row bsp-param-row--inline">
              <label class="bsp-param-label">内阴影 (inset)</label>
              <div class="bsp-param-control">
                <el-switch
                  :model-value="activeLayer.inset"
                  size="small"
                  @update:model-value="(val: boolean) => updateLayerProperty(activeLayerIndex, 'inset', val)"
                />
                <span class="bsp-inset-hint">{{ activeLayer.inset ? '内阴影' : '外阴影' }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-scrollbar>
    </div>

    <!-- CSS 代码输出 -->
    <div v-if="showCodeOutput" class="bsp-section bsp-code-section">
      <div class="bsp-section-header">
        <span class="bsp-section-title">📋 CSS 代码</span>
        <el-button size="small" type="primary" plain @click="copyShadow">
          <el-icon><CopyDocument /></el-icon> 复制代码
        </el-button>
      </div>
      <el-scrollbar class="bsp-code-scroll" max-height="120">
        <div class="bsp-code-block">
          <code>box-shadow: {{ currentBoxShadow }};</code>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

  <style lang="scss" scoped>
  // ==================== 变量 ====================
$bsp-prefix: 'bsp';
$bsp-radius-sm: 6px;
$bsp-radius-md: 10px;
$bsp-border-color: #e4e7ed;
$bsp-bg-light: #fafbfc;
$bsp-bg-hover: #f0f5ff;
$bsp-bg-active: #e6f0ff;
$bsp-primary: #409eff;
$bsp-primary-light: #ecf5ff;
$bsp-text-primary: #303133;
$bsp-text-secondary: #606266;
$bsp-text-tertiary: #909399;
$bsp-transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);

.#{$bsp-prefix}-container {
  font-family: var(--wc-font-sans);
  color: $bsp-text-primary;
  user-select: none;

  &--compact {
    .#{$bsp-prefix}-section {
      margin-bottom: 12px;
    }

    .#{$bsp-prefix}-section-header {
      padding: 10px 12px;
    }

    .#{$bsp-prefix}-section-header--clickable {
      cursor: pointer;
    }

    .#{$bsp-prefix}-preset-grid {
      grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
      gap: 8px;
      padding: 10px 12px;
    }

    .#{$bsp-prefix}-preset-card {
      padding: 8px 6px 6px;
    }

    .#{$bsp-prefix}-preset-preview {
      width: 48px;
      height: 48px;
      margin-bottom: 6px;
    }

    .#{$bsp-prefix}-preview-block {
      margin: 12px;
      height: 72px;
    }

    .#{$bsp-prefix}-params {
      padding: 0 12px 12px;
    }

    .#{$bsp-prefix}-param-row {
      margin-bottom: 10px;
    }
  }
}

.#{$bsp-prefix}-section-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.#{$bsp-prefix}-section {
  margin-bottom: 20px;
  background: #fff;
  border: 1px solid $bsp-border-color;
  border-radius: $bsp-radius-md;
  overflow: hidden;
  transition: border-color $bsp-transition;
  &:hover {
    border-color: #d0d5dd;
  }
}

.#{$bsp-prefix}-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: $bsp-bg-light;
  border-bottom: 1px solid $bsp-border-color;
  gap: 10px;
}

.#{$bsp-prefix}-section-title {
  font-size: 14px;
  font-weight: 600;
  color: $bsp-text-primary;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  .el-icon {
    font-size: 16px;
    color: $bsp-primary;
  }
}

.#{$bsp-prefix}-layer-count {
  font-size: 12px;
  color: $bsp-text-tertiary;
  white-space: nowrap;
}

// 分类标签
.#{$bsp-prefix}-categories {
  padding: 10px 16px 0;
  overflow: hidden;
}

.#{$bsp-prefix}-category-list {
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
  padding-bottom: 4px;
}

.#{$bsp-prefix}-category-tag {
  display: inline-block;
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 500;
  color: $bsp-text-secondary;
  background: #f5f7fa;
  border-radius: 20px;
  cursor: pointer;
  white-space: nowrap;
  transition: all $bsp-transition;
  border: 1px solid transparent;
  &:hover {
    background: $bsp-bg-hover;
    color: $bsp-primary;
  }
  &.is-active {
    background: $bsp-primary-light;
    color: $bsp-primary;
    border-color: $bsp-primary;
    font-weight: 600;
  }
}

.#{$bsp-prefix}-preset-scroll,
.#{$bsp-prefix}-custom-scroll,
.#{$bsp-prefix}-code-scroll {
  width: 100%;
}

.#{$bsp-prefix}-categories-scroll,
.#{$bsp-prefix}-layer-tabs-scroll {
  width: 100%;
}

// 预设网格
.#{$bsp-prefix}-preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 10px;
  padding: 14px 16px;
}

.#{$bsp-prefix}-preset-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 10px 10px;
  border: 2px solid transparent;
  border-radius: $bsp-radius-md;
  cursor: pointer;
  background: #fff;
  transition: all $bsp-transition;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  &:hover {
    border-color: #c6d8f0;
    background: #fafcfe;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }
  &.is-selected {
    border-color: $bsp-primary;
    background: $bsp-primary-light;
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
  }
}

.#{$bsp-prefix}-preset-preview {
  width: 60px;
  height: 60px;
  background: #fff;
  border-radius: $bsp-radius-sm;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    box-shadow $bsp-transition,
    transform $bsp-transition;
}

.#{$bsp-prefix}-preset-preview-dot {
  width: 14px;
  height: 14px;
  background: #e0e5ec;
  border-radius: 50%;
}

.#{$bsp-prefix}-preset-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: $bsp-text-secondary;
  text-align: center;
  line-height: 1.3;
}

.#{$bsp-prefix}-preset-name {
  font-weight: 500;
  max-width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.#{$bsp-prefix}-preset-info-icon {
  font-size: 13px;
  color: $bsp-text-tertiary;
  cursor: help;
  flex-shrink: 0;
}

.#{$bsp-prefix}-preset-check {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
  background: $bsp-primary;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  animation: bsp-check-in 0.25s ease;
}

@keyframes bsp-check-in {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

// 预览块
.#{$bsp-prefix}-preview-block {
  margin: 16px 18px 18px;
  height: 100px;
  border-radius: $bsp-radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    box-shadow 0.35s ease,
    background-color 0.3s ease;
  cursor: default;
  position: relative;
  overflow: hidden;
}

.#{$bsp-prefix}-preview-text {
  font-size: 13px;
  color: $bsp-text-tertiary;
  letter-spacing: 0.5px;
  pointer-events: none;
  font-weight: 500;
}

// 图层标签
.#{$bsp-prefix}-layer-tabs {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  padding: 12px 16px;
  align-items: center;
  border-bottom: 1px dashed $bsp-border-color;
  width: max-content;
  min-width: 100%;
}

.#{$bsp-prefix}-layer-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f5f7fa;
  border-radius: 20px;
  font-size: 11px;
  color: $bsp-text-secondary;
  cursor: pointer;
  transition: all $bsp-transition;
  border: 1.5px solid transparent;
  white-space: nowrap;
  max-width: 200px;
  &:hover {
    background: $bsp-bg-hover;
    border-color: #c6d8f0;
  }
  &.is-active {
    background: $bsp-primary-light;
    border-color: $bsp-primary;
    color: $bsp-primary;
    font-weight: 600;
  }
}

.#{$bsp-prefix}-layer-tab-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 140px;
  font-family:
    var(--bsp-font-mono, var(--wc-font-mono, ui-monospace, Consolas, Monaco, monospace));
  font-size: 10px;
}

.#{$bsp-prefix}-layer-tab-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  cursor: pointer;
  color: $bsp-text-tertiary;
  transition: all $bsp-transition;
  flex-shrink: 0;
  &:hover {
    background: #fde8e8;
    color: #f56c6c;
  }
  .el-icon {
    font-size: 11px;
  }
}

.#{$bsp-prefix}-add-layer-btn {
  flex-shrink: 0;
}

// 参数面板
.#{$bsp-prefix}-params {
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.#{$bsp-prefix}-param-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  &--inline {
    flex-direction: row;
    align-items: center;
    gap: 14px;
  }
}

.#{$bsp-prefix}-param-label {
  font-size: 12px;
  font-weight: 500;
  color: $bsp-text-secondary;
  white-space: nowrap;
  min-width: 110px;
  flex-shrink: 0;
}

.#{$bsp-prefix}-param-control {
  flex: 1;
  min-width: 0;
  &--color {
    display: flex;
    align-items: center;
    gap: 10px;
  }
}

.#{$bsp-prefix}-color-text {
  font-size: 11px;
  font-family:
    var(--bsp-font-mono, var(--wc-font-mono, ui-monospace, Consolas, Monaco, monospace));
  color: $bsp-text-tertiary;
  background: #f5f7fa;
  padding: 3px 8px;
  border-radius: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}

.#{$bsp-prefix}-inset-hint {
  font-size: 11px;
  color: $bsp-text-tertiary;
  margin-left: 4px;
}

// 代码块
.#{$bsp-prefix}-code-scroll {
  margin: 0 18px 14px;
}

.#{$bsp-prefix}-code-block {
  margin: 12px 0 0;
  padding: 14px 16px;
  background: #1e1e2e;
  border-radius: $bsp-radius-sm;
  font-family: var(--wc-font-mono);
  font-size: 13px;
  line-height: 1.7;
  position: relative;
  code {
    color: #a6e3a1;
    word-break: break-all;
    white-space: pre-wrap;
    letter-spacing: 0.3px;
  }
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, #409eff, #a6e3a1, #f9e2af);
    border-radius: $bsp-radius-sm $bsp-radius-sm 0 0;
    opacity: 0.6;
  }
}

// 响应式
@media (max-width: 768px) {
  .#{$bsp-prefix}-preset-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)) !important;
    gap: 8px !important;
    padding: 10px 12px !important;
  }
  .#{$bsp-prefix}-preset-preview {
    width: 44px;
    height: 44px;
  }
  .#{$bsp-prefix}-param-row--inline {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 6px !important;
  }
  .#{$bsp-prefix}-preview-block {
    height: 70px;
    margin: 12px 14px 14px;
  }
}
</style>
