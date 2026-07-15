<script lang="ts" setup>
import type { WidgetCatalogConfig, WidgetGroupItem, WidgetVariantItem } from './widget-catalog'
import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { ArrowRight, Close } from '@element-plus/icons-vue'
import { computed, ref, watch } from 'vue'
import { SvgIcon } from '@/components/svg-icon'
import { useControlStore } from '@/stores'
import { isChartComponent } from '@/utils/datasetBinding'
import ChartVariantPreview from './ChartVariantPreview.vue'
import ComponentPreview from './ComponentPreview.vue'
import {
  createBlockFromWidgetVariant,
  isWidgetVariantAvailable,
  resolveWidgetComponent,
} from './widget-catalog'

const props = defineProps<{
  config: WidgetCatalogConfig
}>()

const emits = defineEmits<{
  dragStart: [value: VisualEditorBlockData, index: number]
  drag: [k: string]
  dragEnd: []
  dblclickAdd: [value: VisualEditorBlockData]
  close: []
}>()

const controlStore = useControlStore()

const activeGroupKey = ref(props.config.groups[0]?.key ?? '')
const activeVariantKey = ref('')

const activeGroup = computed(() =>
  props.config.groups.find(g => g.key === activeGroupKey.value) ?? props.config.groups[0],
)

const activeVariants = computed(() => activeGroup.value?.variants ?? [])

const activeVariant = computed(() =>
  activeVariants.value.find(v => v.key === activeVariantKey.value)
  ?? activeVariants.value.find(v => isWidgetVariantAvailable(v))
  ?? activeVariants.value[0],
)

const activeComponent = computed(() => {
  const key = activeVariant.value?.componentKey
  return key ? resolveWidgetComponent(key) : null
})

const activeChartVariant = computed(() =>
  String(activeVariant.value?.preset?.chartVariant ?? 'basic'),
)

const showChartPreview = computed(() =>
  Boolean(activeVariant.value?.componentKey && isChartComponent(activeVariant.value.componentKey)),
)

watch(
  () => props.config,
  (config) => {
    if (!config.groups.length)
      return
    activeGroupKey.value = config.groups[0].key
    selectFirstAvailableVariant(config.groups[0])
  },
  { immediate: true },
)

watch(activeGroupKey, (key) => {
  const group = props.config.groups.find(g => g.key === key)
  if (group)
    selectFirstAvailableVariant(group)
})

function selectFirstAvailableVariant(group: WidgetGroupItem) {
  const available = group.variants.find(v => isWidgetVariantAvailable(v))
  activeVariantKey.value = available?.key ?? group.variants[0]?.key ?? ''
}

function onGroupEnter(group: WidgetGroupItem) {
  activeGroupKey.value = group.key
}

function onVariantEnter(variant: WidgetVariantItem) {
  activeVariantKey.value = variant.key
}

function dragStart(e: DragEvent, variant: WidgetVariantItem, index: number) {
  if (!isWidgetVariantAvailable(variant))
    return

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

function onDblClick(variant: WidgetVariantItem) {
  const block = createBlockFromWidgetVariant(variant)
  if (block)
    emits('dblclickAdd', block)
}
</script>

<template>
  <div :class="$style.panel">
    <div :class="$style.header">
      <div :class="$style.headerMain">
        <SvgIcon :size="16" :name="config.icon" />
        <span>{{ config.title }}</span>
      </div>
      <button
        type="button"
        :class="$style.closeBtn"
        aria-label="关闭"
        @click.stop="emits('close')"
      >
        <el-icon :size="14">
          <Close />
        </el-icon>
      </button>
    </div>

    <div :class="$style.body">
      <!-- 分组列 -->
      <div :class="$style.col">
        <div :class="$style.colTitle">
          {{ config.groupColumnLabel }}
        </div>
        <el-scrollbar :class="$style.colScroll" max-height="460px">
          <button
            v-for="group in config.groups"
            :key="group.key"
            type="button"
            :class="[
              $style.groupItem,
              { [$style['groupItem--active']]: activeGroupKey === group.key },
            ]"
            @mouseenter="onGroupEnter(group)"
            @focus="onGroupEnter(group)"
          >
            <SvgIcon :size="16" :name="group.icon || config.icon" />
            <span :class="$style.groupLabel">{{ group.label }}</span>
            <el-icon :class="$style.groupArrow">
              <ArrowRight />
            </el-icon>
          </button>
        </el-scrollbar>
      </div>

      <!-- 子项列 -->
      <div :class="$style.col">
        <div :class="$style.colTitle">
          {{ activeGroup?.label }}
        </div>
        <el-scrollbar :class="$style.colScroll" max-height="460px">
          <button
            v-for="variant in activeVariants"
            :key="variant.key"
            type="button"
            :disabled="!isWidgetVariantAvailable(variant)"
            :class="[
              $style.variantItem,
              { [$style['variantItem--active']]: activeVariantKey === variant.key },
              { [$style['variantItem--disabled']]: !isWidgetVariantAvailable(variant) },
            ]"
            @mouseenter="onVariantEnter(variant)"
            @focus="onVariantEnter(variant)"
            @dblclick="onDblClick(variant)"
          >
            <span :class="$style.variantLabel">{{ variant.label }}</span>
            <el-tag v-if="variant.comingSoon" size="small" type="info" :class="$style.soonTag">
              即将上线
            </el-tag>
          </button>
        </el-scrollbar>
      </div>

      <!-- 预览列 -->
      <div :class="[$style.col, $style.colPreview]">
        <div :class="$style.colTitle">
          预览
        </div>

        <div
          v-if="activeVariant && activeComponent && isWidgetVariantAvailable(activeVariant)"
          :class="$style.previewCard"
          draggable="true"
          @dragstart="(e) => dragStart(e, activeVariant!, 0)"
          @drag="dragging"
          @dragend="dragEnd"
          @dblclick="onDblClick(activeVariant!)"
        >
          <div :class="$style.previewCanvas">
            <ChartVariantPreview
              v-if="showChartPreview && activeVariant"
              :key="activeVariant.key"
              :component-key="activeVariant.componentKey"
              :chart-variant="activeChartVariant"
            />
            <ComponentPreview
              v-else-if="activeComponent"
              :key="activeVariant!.key"
              :component="activeComponent"
            />
          </div>
          <div :class="$style.previewMeta">
            <div :class="$style.previewTitle">
              {{ activeVariant.label }}
            </div>
            <div :class="$style.previewDesc">
              {{ activeVariant.description || activeComponent.description }}
            </div>
            <div :class="$style.previewHint">
              拖到画布，或双击添加
            </div>
          </div>
        </div>

        <div v-else-if="activeVariant" :class="$style.previewPlaceholder">
          <SvgIcon :size="40" :name="config.icon" />
          <div :class="$style.previewTitle">
            {{ activeVariant.label }}
          </div>
          <div :class="$style.previewDesc">
            {{ activeVariant.description }}
          </div>
          <el-tag type="info" size="small">
            即将上线
          </el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
.panel {
  width: 532px;
  overflow: hidden;
  border-radius: var(--ve-radius-md, 10px);
  border: 1px solid var(--ve-paper-edge, var(--el-border-color-light));
  background: var(--el-bg-color);
  box-shadow:
    0 1px 0 color-mix(in srgb, var(--el-color-primary) 8%, transparent),
    var(--el-box-shadow);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 10px 10px 14px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--el-text-color-primary);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.headerMain {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.closeBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.18s ease;

  &:hover {
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
  }

  &:active {
    background: var(--el-fill-color);
  }
}

.body {
  display: grid;
  grid-template-columns: 128px 132px 1fr;
  min-height: 360px;
}

.col {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-right: 1px solid var(--el-border-color-lighter);

  &:last-child {
    border-right: none;
  }
}

.colTitle {
  flex-shrink: 0;
  padding: 8px 10px 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.colScroll {
  flex: 1;
  min-height: 0;
}

.groupItem {
  display: flex;
  align-items: center;
  gap: 4px;
  width: calc(100% - 8px);
  margin: 2px 4px;
  padding: 8px 6px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-primary);
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover,
  &:focus-visible {
    outline: none;
    background: var(--ve-active-fill, var(--el-color-primary-light-9));
    color: var(--el-color-primary);
  }

  &--active {
    background: var(--ve-active-fill, var(--el-color-primary-light-9));
    color: var(--el-color-primary);
    font-weight: 600;
    box-shadow: inset 2px 0 0 var(--ve-spine, var(--el-color-primary));
  }
}

.groupLabel {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.groupArrow {
  flex-shrink: 0;
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.variantItem {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  width: calc(100% - 8px);
  margin: 2px 4px;
  padding: 8px 8px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-primary);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover,
  &:focus-visible {
    outline: none;
    background: var(--ve-active-fill, var(--el-color-primary-light-9));
    color: var(--el-color-primary);
  }

  &--active {
    background: var(--ve-active-fill, var(--el-color-primary-light-9));
    color: var(--el-color-primary);
    box-shadow: inset 2px 0 0 var(--ve-spine, var(--el-color-primary));
  }

  &--disabled {
    opacity: 0.55;
    cursor: not-allowed;

    &:hover,
    &:focus-visible {
      background: transparent;
      color: var(--el-text-color-primary);
    }
  }
}

.variantLabel {
  line-height: 1.3;
}

.soonTag {
  transform: scale(0.92);
  transform-origin: left center;
}

.colPreview {
  padding: 0 10px 10px;
}

.previewCard {
  display: flex;
  flex-direction: column;
  height: calc(100% - 28px);
  min-height: 280px;
  border-radius: var(--ve-radius-md, 10px);
  border: 1px solid var(--ve-paper-edge, var(--el-border-color-light));
  background:
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--el-color-primary) 10%, transparent) 0,
      color-mix(in srgb, var(--el-color-primary) 10%, transparent) 3px,
      transparent 3px,
      transparent 100%
    ),
    var(--el-fill-color-blank);
  cursor: grab;
  overflow: hidden;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    border-color: color-mix(in srgb, var(--el-color-primary) 40%, var(--el-border-color));
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 16%, transparent);
  }

  &:active {
    cursor: grabbing;
  }
}

.previewCanvas {
  flex: 1;
  min-height: 120px;
  padding: 8px;
  background:
    radial-gradient(circle, var(--ve-grid-dot, var(--el-fill-color-lighter)) 1px, transparent 1px)
      var(--el-fill-color-light);
  background-size: 16px 16px;
  overflow: hidden;
}

.previewMeta {
  padding: 10px 12px 12px;
}

.previewTitle {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.4;
}

.previewDesc {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.previewHint {
  margin-top: 8px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.previewPlaceholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: calc(100% - 28px);
  min-height: 280px;
  padding: 16px;
  border-radius: 10px;
  border: 1px dashed var(--el-border-color);
  background: var(--el-fill-color-lighter);
  text-align: center;
}
</style>
