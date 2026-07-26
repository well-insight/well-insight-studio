<script lang="ts" setup>
import type { WidgetCatalogConfig, WidgetVariantItem } from './widget-catalog'
import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { computed, ref } from 'vue'
import { SvgIcon } from '@/components/svg-icon'
import { useControlStore } from '@/stores'
import { createBlockFromWidgetVariant, isWidgetVariantAvailable, WIDGET_CATALOGS } from './widget-catalog'

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

const controlStore = useControlStore()

const catalogs = computed<WidgetCatalogConfig[]>(() => WIDGET_CATALOGS)
const currentCategory = ref('all')
const currentSearch = ref('')
const gridColumns = ref<1 | 2>(2)

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
        icon: group.icon || catalog.icon,
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
        <div
          v-for="(item, index) in filteredComponents"
          :key="item.key"
          :class="[$style['component-card'], { [$style.disabled]: !item.available }]"
          :draggable="item.available"
          :title="item.description"
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
  margin-bottom: 0;

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
    color: #1a5a9a;
    background: rgba(37, 99, 235, 0.05);
    border: 1px solid rgba(37, 99, 235, 0.06);
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
  border-radius: 8px;
  background: rgba(37, 99, 235, 0.08);
  border: 1px solid rgba(37, 99, 235, 0.12);
  color: #2563eb;
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
  color: #9aa9bf;
  line-height: 0;
  pointer-events: none;
}

.layout-switcher {
  display: inline-flex;
  align-items: center;
  padding: 2px;
  gap: 2px;
  flex-shrink: 0;
  border: 1px solid rgba(82, 124, 181, 0.16);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.56);

  button {
    width: 26px;
    height: 26px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: 6px;
    color: #7a8da8;
    background: transparent;
    cursor: pointer;
    transition:
      color 0.3s ease,
      background 0.3s ease;

    &:hover {
      color: #2563eb;
      background: rgba(37, 99, 235, 0.06);
    }

    &.active {
      color: #2563eb;
      background: rgba(37, 99, 235, 0.1);
    }
  }
}

.search-box input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border-radius: 30px;
  border: 1px solid rgba(82, 124, 181, 0.16);
  background: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  outline: none;
  transition:
    color 0.3s ease,
    background 0.3s ease;
  font-family: inherit;
  color: var(--el-text-color-primary);
}

.search-box input::placeholder {
  color: #a8b7ce;
}

.search-box input:focus {
  border-color: #2563eb;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  overflow: visible;
  padding: 2px 0 10px;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(82, 124, 181, 0.13);
  flex-shrink: 0;
}

.tab {
  padding: 4px 14px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 600;
  color: #4a6a8a;
  background: rgba(0, 40, 80, 0.02);
  border: 1px solid rgba(37, 99, 235, 0.05);
  cursor: pointer;
  flex: 0 0 auto;
  transition:
    color 0.3s ease,
    background 0.3s ease,
    border-color 0.3s ease;
  font-family: inherit;

  &:hover {
    background: rgba(37, 99, 235, 0.06);
    color: var(--el-text-color-primary);
  }

  &.active {
    background: #2563eb;
    border-color: #2563eb;
    color: #fff;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
  }
}

.badge {
  font-size: 10px;
  background: rgba(0, 0, 0, 0.06);
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
  transition: grid-template-columns 0.3s ease;
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
  color: #8292a8;
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

.component-grid.two-columns {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.component-card {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 14px;
  padding: 12px 8px 10px;
  border: 1px solid rgba(82, 124, 181, 0.13);
  box-shadow: 0 4px 14px rgba(31, 58, 112, 0.05);
  transition:
    box-shadow 0.3s ease,
    transform 0.3s ease,
    border-color 0.3s ease,
    background 0.3s ease;
  cursor: grab;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  user-select: none;
  position: relative;
  padding-bottom: 30px;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(37, 99, 235, 0.22);
    box-shadow: 0 12px 24px -12px rgba(31, 58, 112, 0.14);
    background: rgba(255, 255, 255, 0.92);
  }

  &:active {
    cursor: grabbing;
    transform: scale(0.97);
  }
}

.card-icon {
  width: 44px;
  height: 44px;
  background: rgba(37, 99, 235, 0.06);
  border: 1px solid rgba(37, 99, 235, 0.08);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #2563eb;
  margin-bottom: 6px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
  transition:
    box-shadow 0.3s ease,
    transform 0.3s ease,
    border-color 0.3s ease,
    background 0.3s ease;
}

.component-card:hover .card-icon {
  background: rgba(37, 99, 235, 0.14);
  border-color: rgba(37, 99, 235, 0.2);
  transform: scale(1.04);
  box-shadow: 0 0 16px rgba(37, 99, 235, 0.12);
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
  color: #8595ab;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.03);
  padding: 2px 10px;
  border-radius: 30px;
  position: absolute;
  right: 8px;
  bottom: 8px;
  margin: 0;
  transition:
    box-shadow 0.3s ease,
    transform 0.3s ease,
    border-color 0.3s ease,
    background 0.3s ease;
}

.component-card:hover .card-drag-hint {
  color: #2563eb;
  background: rgba(37, 99, 235, 0.06);
  border-color: rgba(37, 99, 235, 0.1);
}

.disabled {
  cursor: not-allowed;
  opacity: 0.5;

  &:hover {
    transform: none;
    border-color: rgba(82, 124, 181, 0.13);
    box-shadow: none;
    background: rgba(255, 255, 255, 0.6);
  }

  &:hover .card-icon {
    background: rgba(37, 99, 235, 0.06);
    color: #2563eb;
  }

  &:hover .card-drag-hint {
    color: #8595ab;
    background: rgba(0, 0, 0, 0.03);
    border-color: transparent;
  }
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px 12px;
  color: #7a8aa3;

  svg {
    color: rgba(82, 124, 181, 0.3);
    margin-bottom: 10px;
  }

  p {
    margin: 0 0 4px;
    font-size: 13px;
    font-weight: 600;
    color: #3a4a6b;
  }

  span {
    font-size: 12px;
    color: #8e9fb5;
  }
}

@media (max-width: 1024px) {
  .component-grid {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .component-card {
    padding: 10px 6px;
  }
}
</style>
