<script lang="ts" setup>
import type { WidgetCatalogConfig, WidgetVariantItem } from './widget-catalog'
import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { computed, ref } from 'vue'
import { SvgIcon } from '@/components/svg-icon'
import { useControlStore } from '@/stores'
import { isChartComponent } from '@/utils/datasetBinding'
import ChartVariantPreview from './ChartVariantPreview.vue'
import ComponentPreview from './ComponentPreview.vue'
import {
  createBlockFromWidgetVariant,
  isWidgetVariantAvailable,
  resolveWidgetComponent,
  WIDGET_CATALOGS,
} from './widget-catalog'

interface ComponentListItem {
  key: string
  label: string
  description: string
  category: string
  categoryLabel: string
  icon: string
  available: boolean
  variant: WidgetVariantItem
}

const emits = defineEmits<{
  dragStart: [value: VisualEditorBlockData, index: number]
  drag: [k: string]
  dragEnd: []
  dblclickAdd: [value: VisualEditorBlockData]
}>()

const VARIANT_ICON_MAP: Record<string, string> = {
  'button': 'comp-icon-button',
  'text': 'comp-icon-text',
  'image': 'comp-icon-image',
  'carousel': 'comp-icon-carousel',
  'divider': 'comp-icon-divider',
  'progress': 'comp-icon-progress',
  'input-text': 'comp-icon-input',
  'input-textarea': 'comp-icon-input',
  'select': 'comp-icon-select',
  'checkbox': 'comp-icon-checkbox',
  'radio': 'comp-icon-radio',
  'switch': 'comp-icon-switch',
  'slider': 'comp-icon-slider',
  'rate': 'comp-icon-rate',
  'datetimePicker': 'comp-icon-datetime-picker',
  'bar-basic': 'comp-icon-chart-bar',
  'bar-gradient': 'comp-icon-chart-bar',
  'bar-stack': 'comp-icon-chart-bar',
  'bar-horizontal': 'comp-icon-chart-bar',
  'line-basic': 'comp-icon-chart-line',
  'line-smooth': 'comp-icon-chart-line',
  'line-area': 'comp-icon-chart-line',
  'pie-basic': 'comp-icon-chart-pie',
  'pie-doughnut': 'comp-icon-chart-pie',
  'pie-rose': 'comp-icon-chart-pie',
  'scatter-basic': 'comp-icon-chart-scatter',
  'scatter-bubble': 'comp-icon-chart-scatter',
  'radar-basic': 'comp-icon-chart-radar',
  'gauge-basic': 'comp-icon-chart-gauge',
  'funnel-basic': 'comp-icon-chart-funnel',
  'container': 'comp-icon-container',
  'layout': 'comp-icon-layout',
  'form': 'comp-icon-form',
}

const controlStore = useControlStore()

const catalogs = computed<WidgetCatalogConfig[]>(() => WIDGET_CATALOGS)
const currentCategory = ref('all')
const currentSearch = ref('')
const gridColumns = ref<1 | 2>(2)
const hoverKey = ref<string | null>(null)

const allComponents = computed<ComponentListItem[]>(() => {
  return catalogs.value.flatMap((catalog) => {
    return catalog.groups.flatMap(group => group.variants.map((variant) => {
      const description = variant.description || `${group.label}组件，可拖入画布后继续配置`
      return {
        key: variant.key,
        label: variant.label,
        description,
        category: catalog.title,
        categoryLabel: catalog.title.replace(/组件$/u, ''),
        icon: VARIANT_ICON_MAP[variant.key] || group.icon || catalog.icon,
        available: isWidgetVariantAvailable(variant),
        variant,
      }
    }))
  })
})

const categoryTabs = computed(() => {
  const tabs = catalogs.value.map(catalog => ({
    key: catalog.title,
    label: catalog.title.replace(/组件$/u, ''),
    count: allComponents.value.filter(item => item.category === catalog.title).length,
  }))

  return [
    { key: 'all', label: '全部', count: allComponents.value.length },
    ...tabs,
  ]
})

const filteredComponents = computed(() => {
  const keyword = currentSearch.value.trim().toLowerCase()

  return allComponents.value.filter((item) => {
    const matchCategory = currentCategory.value === 'all' || item.category === currentCategory.value
    const matchSearch = !keyword
      || item.label.toLowerCase().includes(keyword)
      || item.description.toLowerCase().includes(keyword)
      || item.categoryLabel.toLowerCase().includes(keyword)

    return matchCategory && matchSearch
  })
})

const hoverPreviewComponent = computed(() => {
  const item = filteredComponents.value.find(component => component.key === hoverKey.value)
  const key = item?.variant?.componentKey
  return key ? resolveWidgetComponent(key) : null
})
const hoverPreviewChartVariant = computed(() => {
  const item = filteredComponents.value.find(component => component.key === hoverKey.value)
  return String(item?.variant?.preset?.chartVariant ?? 'basic')
})
const hoverPreviewIsChart = computed(() => {
  const item = filteredComponents.value.find(component => component.key === hoverKey.value)
  return Boolean(item?.variant?.componentKey && isChartComponent(item.variant.componentKey))
})

function onVariantDragStart(e: DragEvent, variant: WidgetVariantItem, index: number) {
  const block = createBlockFromWidgetVariant(variant)
  if (!block)
    return

  e.dataTransfer?.setData('text/plain', variant.componentKey)
  e.dataTransfer!.effectAllowed = 'move'
  controlStore.setIsDragging(true)
  controlStore.setMoveVisualData(block)
  emits('dragStart', block, index)
}

function dragging() {
  controlStore.setDraggingVisualKey(Date.now().toString())
  emits('drag', controlStore.draggingVisualKey)
}

function dragEnd() {
  controlStore.setIsDragging(false)
  emits('dragEnd')
}

function onVariantDblClick(variant: WidgetVariantItem) {
  const block = createBlockFromWidgetVariant(variant)
  if (block)
    emits('dblclickAdd', block)
}

function showHoverPreview(item: ComponentListItem) {
  if (!item.available)
    return

  hoverKey.value = item.key
}

function hideHoverPreview() {
  hoverKey.value = null
}
</script>

<template>
  <aside :class="$style['left-panel']">
    <div :class="$style['panel-header']">
      <h2>
        <span :class="$style['panel-header-icon']" aria-hidden="true">
          <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="3" width="5" height="5" rx="1" fill="currentColor" />
            <rect x="12" y="3" width="5" height="5" rx="1" fill="currentColor" />
            <rect x="3" y="12" width="5" height="5" rx="1" fill="currentColor" />
            <rect x="12" y="12" width="5" height="5" rx="1" fill="currentColor" />
          </svg>
        </span>
        组件库
      </h2>
      <span>{{ filteredComponents.length }} 个</span>
    </div>

    <div :class="$style['search-row']">
      <div :class="$style['search-box']">
        <span :class="$style['search-icon']" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="5.75" stroke="currentColor" stroke-width="1.8" />
            <path d="M13.2 13.2L17 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
        </span>
        <input v-model="currentSearch" type="text" autocomplete="off" placeholder="搜索组件...">
      </div>
      <div :class="$style['layout-switcher']" role="group" aria-label="组件列表布局">
        <button type="button" :class="{ [$style.active]: gridColumns === 2 }" aria-label="双栏布局" :aria-pressed="gridColumns === 2" @click="gridColumns = 2">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="6" height="14" rx="1" stroke="currentColor" stroke-width="1.6" />
            <rect x="11" y="3" width="6" height="14" rx="1" stroke="currentColor" stroke-width="1.6" />
          </svg>
        </button>
        <button type="button" :class="{ [$style.active]: gridColumns === 1 }" aria-label="单栏布局" :aria-pressed="gridColumns === 1" @click="gridColumns = 1">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="14" height="6" rx="1" stroke="currentColor" stroke-width="1.6" />
            <rect x="3" y="11" width="14" height="6" rx="1" stroke="currentColor" stroke-width="1.6" />
          </svg>
        </button>
      </div>
    </div>

    <div :class="$style['category-tabs']">
      <button
        v-for="tab in categoryTabs"
        :key="tab.key"
        type="button"
        :data-category-key="tab.key"
        :class="[$style.tab, { [$style.active]: currentCategory === tab.key }]"
        @click="currentCategory = tab.key"
      >
        {{ tab.label }}
        <span :class="$style.badge">{{ tab.count }}</span>
      </button>
    </div>

    <el-scrollbar :class="$style['component-grid-wrap']">
      <div :class="[$style['component-grid'], gridColumns === 1 ? $style['single-column'] : $style['two-columns']]">
        <el-popover
          v-for="(item, index) in filteredComponents"
          :key="item.key"
          :width="340"
          placement="right-start"
          :show-arrow="false"
          trigger="hover"
          :hide-after="120"
          popper-class="component-hover-popover"
        >
          <template #reference>
            <div
              :class="[$style['component-card'], { [$style.disabled]: !item.available }]"
              :draggable="item.available"
              :title="item.description"
              @mouseenter="showHoverPreview(item)"
              @mouseleave="hideHoverPreview"
              @focus="showHoverPreview(item)"
              @blur="hideHoverPreview"
              @dragstart="(e) => item.available && onVariantDragStart(e, item.variant, index)"
              @drag="dragging"
              @dragend="dragEnd"
              @dblclick="item.available && onVariantDblClick(item.variant)"
            >
              <div :class="$style['card-icon']">
                <SvgIcon :size="18" :name="item.icon" />
              </div>
              <div :class="$style['card-content']">
                <div :class="$style['card-name']">
                  {{ item.label }}
                </div>
                <div :class="$style['card-description']">
                  {{ item.description }}
                </div>
                <div :class="$style['card-drag-hint']">
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M5 3.5h6M5 8h6M5 12.5h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                  </svg>
                  {{ item.available ? '拖拽' : '即将开放' }}
                </div>
              </div>
            </div>
          </template>

          <div :class="$style['hover-preview']">
            <div :class="$style['hover-preview__header']">
              <div :class="$style['hover-preview__title']">
                <SvgIcon :size="16" :name="item.icon" />
                <span>{{ item.label }}</span>
              </div>
              <el-tag size="small" :type="item.available ? 'primary' : 'info'">
                {{ item.available ? '可拖拽' : '即将开放' }}
              </el-tag>
            </div>

            <div :class="$style['hover-preview__body']">
              <div :class="$style['hover-preview__surface']">
                <div :class="$style['hover-preview__content']">
                  <ChartVariantPreview
                    v-if="hoverKey === item.key && hoverPreviewIsChart && hoverPreviewComponent"
                    :key="`${item.key}-chart`"
                    :component-key="item.variant.componentKey"
                    :chart-variant="hoverPreviewChartVariant"
                  />
                  <ComponentPreview
                    v-else-if="hoverKey === item.key && hoverPreviewComponent"
                    :key="`${item.key}-component`"
                    :component="hoverPreviewComponent"
                  />
                </div>
              </div>
              <div :class="$style['hover-preview__meta']">
                <div :class="$style['hover-preview__desc']">
                  {{ item.description }}
                </div>
                <div :class="$style['hover-preview__tip']">
                  预览仅用于查看样式，拖拽或双击可添加到画布
                </div>
              </div>
            </div>
          </div>
        </el-popover>

        <div v-if="!filteredComponents.length" :class="$style['empty-state']">
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <rect x="8" y="8" width="32" height="32" rx="10" stroke="currentColor" stroke-width="2.2" opacity="0.28" />
            <circle cx="21" cy="21" r="4" fill="currentColor" opacity="0.28" />
            <path d="M28.5 28.5L36 36" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
          </svg>
          <p>没有找到匹配的组件</p>
          <span>试试切换分类或更换关键词</span>
        </div>
      </div>
    </el-scrollbar>
  </aside>
</template>

<style lang="scss" module>
.left-panel {
  width: 100%;
  height: 100%;
  background: transparent;
  display: flex;
  flex-direction: column;
  padding: 0 14px 12px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 54px;
  min-height: 54px;
  box-sizing: border-box;

  h2 {
    font-size: 15px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--el-text-color-primary);
    margin: 0;
  }

  > span {
    font-size: 11px;
    font-weight: 600;
    color: var(--el-color-primary);
    background: var(--ve-chip-bg, color-mix(in srgb, var(--el-color-primary) 8%, transparent));
    border: 1px solid var(--ve-chip-border, color-mix(in srgb, var(--el-color-primary) 16%, transparent));
    padding: 2px 10px;
    border-radius: 30px;
  }
}

.panel-header-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: var(--ve-radius-sm, 8px);
  background: var(--ve-chip-bg, color-mix(in srgb, var(--el-color-primary) 10%, transparent));
  border: 1px solid var(--ve-chip-border, color-mix(in srgb, var(--el-color-primary) 18%, transparent));
  color: var(--el-color-primary);
}

.search-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 0;
  margin-bottom: 0;
  flex-shrink: 1;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--el-text-color-placeholder);
  line-height: 0;
  pointer-events: none;
}

.layout-switcher {
  display: inline-flex;
  align-items: center;
  padding: 2px;
  gap: 2px;
  flex-shrink: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--ve-radius-sm, 8px);
  background: var(--el-fill-color-blank);

  button {
    width: 26px;
    height: 26px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: 6px;
    color: var(--el-text-color-secondary);
    background: transparent;
    cursor: pointer;

    &:hover {
      color: var(--el-color-primary);
      background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
    }

    &.active {
      color: var(--el-color-primary);
      background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
    }
  }
}

.search-box input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border-radius: 30px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-blank);
  font-size: 13px;
  outline: none;
  font-family: inherit;
  color: var(--el-text-color-primary);
}

.search-box input::placeholder {
  color: var(--el-text-color-placeholder);
}

.search-box input:focus {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-bg-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  overflow: visible;
  padding: 2px 0 10px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  flex-shrink: 0;
}

.tab {
  padding: 4px 14px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-extra-light);
  cursor: pointer;
  flex: 0 0 auto;
  font-family: inherit;

  &:hover {
    background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
    color: var(--el-text-color-primary);
  }

  &.active {
    background: var(--el-color-primary);
    border-color: var(--el-color-primary);
    color: var(--el-color-white);
    box-shadow: 0 4px 12px color-mix(in srgb, var(--el-color-primary) 28%, transparent);
  }
}

.badge {
  font-size: 10px;
  background: color-mix(in srgb, var(--el-text-color-primary) 8%, transparent);
  color: inherit;
  padding: 0 6px;
  border-radius: 20px;
  margin-left: 4px;
  display: inline-block;
}

.tab.active .badge {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
}

.component-grid-wrap {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  margin-right: -4px;

  :global(.el-scrollbar__wrap) {
    overflow-x: hidden;
  }

  :global(.el-scrollbar__view) {
    min-height: 100%;
    padding-right: 2px;
  }
}

.component-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.component-grid.single-column {
  grid-template-columns: 1fr;
}

.component-grid.single-column .component-card {
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding: 12px 14px 30px;
  text-align: left;
}

.component-grid.single-column .card-icon {
  flex: 0 0 44px;
  margin: 0 12px 0 0;
}

.card-content {
  min-width: 0;
  flex: 1;
}

.component-grid.single-column .card-name {
  margin-bottom: 4px;
}

.card-description {
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.component-grid.single-column .card-drag-hint {
  width: fit-content;
  margin: 0;
  position: absolute;
  right: 8px;
  bottom: 8px;
}

.component-grid.two-columns .card-description {
  display: none;
}

.component-grid.two-columns .card-content {
  width: 100%;
}

.component-card {
  background: var(--el-bg-color);
  border-radius: var(--ve-radius-md, 14px);
  padding: 12px 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: none;
  cursor: grab;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  user-select: none;
  position: relative;
  padding-bottom: 30px;

  &:hover {
    border-color: color-mix(in srgb, var(--el-color-primary) 32%, transparent);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 18%, transparent);
    background: var(--el-bg-color);
  }

  &:active {
    cursor: grabbing;
    transform: scale(0.98);
  }
}

:global(html.dark) .component-card {
  background: color-mix(in srgb, var(--el-bg-color) 86%, var(--el-bg-color-overlay));
  border-color: color-mix(in srgb, var(--el-color-primary) 14%, var(--el-border-color-light));

  &:hover {
    border-color: color-mix(in srgb, var(--el-color-primary) 38%, var(--el-border-color));
    background: color-mix(in srgb, var(--el-bg-color-overlay) 88%, var(--el-bg-color));
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 20%, transparent);
  }
}

:global(html.dark) .search-box input,
:global(html.dark) .layout-switcher {
  background: color-mix(in srgb, var(--el-bg-color) 82%, var(--el-bg-color-overlay));
  border-color: color-mix(in srgb, var(--el-color-primary) 12%, var(--el-border-color-light));
}

.card-icon {
  width: 44px;
  height: 44px;
  background: var(--ve-chip-bg, color-mix(in srgb, var(--el-color-primary) 10%, transparent));
  border: 1px solid var(--ve-chip-border, color-mix(in srgb, var(--el-color-primary) 16%, transparent));
  border-radius: var(--ve-radius-sm, 12px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: var(--el-color-primary);
  margin-bottom: 6px;
}

.component-card:hover .card-icon {
  background: color-mix(in srgb, var(--el-color-primary) 16%, transparent);
  border-color: color-mix(in srgb, var(--el-color-primary) 28%, transparent);
  transform: scale(1.03);
}

.card-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.card-drag-hint {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--el-fill-color-lighter);
  padding: 2px 10px;
  border-radius: 30px;
  position: absolute;
  right: 8px;
  bottom: 8px;
  margin: 0;
}

.component-card:hover .card-drag-hint {
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
}

.disabled {
  cursor: not-allowed;
  opacity: 0.5;

  &:hover {
    transform: none;
    border-color: var(--el-border-color-lighter);
    box-shadow: none;
    background: var(--el-bg-color);
  }

  &:hover .card-icon {
    background: var(--ve-chip-bg, color-mix(in srgb, var(--el-color-primary) 10%, transparent));
    color: var(--el-color-primary);
    transform: none;
  }

  &:hover .card-drag-hint {
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-lighter);
  }
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px 12px;
  color: var(--el-text-color-secondary);

  svg {
    color: var(--el-border-color);
    margin-bottom: 10px;
  }

  p {
    margin: 0 0 4px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  span {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

:global(.component-hover-popover) {
  --el-popover-padding: 0;
  --el-popover-border-radius: 14px;

  overflow: hidden;
  padding: 0 !important;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 16%, var(--el-border-color-lighter));
  background: color-mix(in srgb, var(--el-bg-color-overlay) 96%, var(--el-bg-color));
  box-shadow:
    0 24px 56px rgba(15, 23, 42, 0.22),
    0 0 0 1px color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  backdrop-filter: blur(14px);
}

.hover-preview {
  width: 100%;
}

.hover-preview__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px 10px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}

.hover-preview__title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.hover-preview__body {
  padding: 12px;
}

.hover-preview__surface {
  min-height: 168px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
}

.hover-preview__content {
  min-height: 168px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hover-preview__content > * {
  max-width: 100%;
}

.hover-preview__meta {
  padding-top: 10px;
}

.hover-preview__desc {
  font-size: 12px;
  line-height: 1.55;
  color: var(--el-text-color-secondary);
}

.hover-preview__tip {
  margin-top: 8px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--el-text-color-placeholder);
}
</style>
