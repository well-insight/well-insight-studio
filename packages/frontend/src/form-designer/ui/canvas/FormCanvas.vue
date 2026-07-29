<script lang="ts" setup>
import type { FormField, FormSchema } from '../../types'
import type { Layout, LayoutItem } from '@/components/grid-layout-plus'
import { Delete, Operation } from '@element-plus/icons-vue'
import { throttle } from '@vexip-ui/utils'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { GridLayout } from '@/components/grid-layout-plus'
import FormFieldPreview from './FormFieldPreview.vue'

const props = defineProps<{
  fields: FormField[]
  activeFieldId: string | null
  formConfig: FormSchema['config']
}>()

const emit = defineEmits<{
  (e: 'select', vid: string | null): void
  (e: 'remove', vid: string): void
  (e: 'addField', field: FormField, index?: number): void
  (e: 'moveField', fromIndex: number, toIndex: number): void
  (e: 'updateFieldLayout', vid: string, patch: Pick<FormField, 'colSpan' | 'layout'>): void
}>()

const cols = 24
const dropId = '__drop_placeholder__'
const canvasModel: Record<string, never> = {}
const isDragOver = ref(false)

/** 鼠标全局位置追踪 */
const mouseAt = { x: -1, y: -1 }
function syncMousePosition(event: MouseEvent) {
  mouseAt.x = event.clientX
  mouseAt.y = event.clientY
}

/** 用 px 撑满可视高度（避免 % 在 el-scrollbar / flex 下塌陷） */
const canvasRoot = ref<HTMLElement>()
const viewportHeight = ref(0)
const canvasPadY = 32 // py-4 * 2
const paperMinHeight = computed(() => {
  if (viewportHeight.value <= 0)
    return undefined
  return `${Math.max(0, viewportHeight.value - canvasPadY)}px`
})

let canvasResizeObserver: ResizeObserver | null = null

onMounted(() => {
  document.addEventListener('dragover', syncMousePosition)
  document.addEventListener('dragend', clearDragArtifacts)
  document.addEventListener('mouseup', clearGridDraggingFlag)
  const el = canvasRoot.value
  if (!el)
    return
  const syncViewport = () => {
    viewportHeight.value = el.clientHeight
  }
  syncViewport()
  canvasResizeObserver = new ResizeObserver(syncViewport)
  canvasResizeObserver.observe(el)
})
onBeforeUnmount(() => {
  document.removeEventListener('dragover', syncMousePosition)
  document.removeEventListener('dragend', clearDragArtifacts)
  document.removeEventListener('mouseup', clearGridDraggingFlag)
  canvasResizeObserver?.disconnect()
  canvasResizeObserver = null
})

// ---- 网格引用与占位 ----
const wrapper = ref<HTMLElement>()
const gridLayout = ref<InstanceType<typeof GridLayout>>()
const placeholderLayoutItem = ref<LayoutItem | null>(null)
const canvasLayout = ref<Layout>([])

/** 清除外部拖入占位与网格拖拽阴影 */
function clearDragArtifacts() {
  isDragOver.value = false
  if (placeholderLayoutItem.value && gridLayout.value) {
    try {
      gridLayout.value.dragEvent('dragend', dropId, 0, 0, 1, 12)
    }
    catch {
      /* ignore */
    }
  }
  placeholderLayoutItem.value = null
  clearGridDraggingFlag()
}

function clearGridDraggingFlag() {
  const state = gridLayout.value?.state as { isDragging?: boolean } | undefined
  if (state)
    state.isDragging = false
}

type FormLayoutItem = LayoutItem & {
  dragAllowFrom?: string
  resizeIgnoreFrom?: string
}

function toLayoutItem(field: FormField, index: number): FormLayoutItem {
  const h = 1
  return {
    i: field._vid,
    x: Math.min(cols - 1, Math.max(0, field.layout?.x ?? 0)),
    y: Math.max(0, field.layout?.y ?? index),
    w: Math.min(cols, Math.max(1, field.colSpan || cols)),
    h,
    minW: 1,
    maxW: cols,
    minH: h,
    maxH: h,
    dragAllowFrom: '.drag-handle',
    resizeIgnoreFrom: '.field-actions,button',
  }
}

function syncCanvasLayoutFromFields() {
  const previous = new Map(canvasLayout.value.map(item => [String(item.i), item]))
  canvasLayout.value = props.fields.map((field, index) => {
    const oldItem = previous.get(field._vid)
    const fromField = toLayoutItem(field, index)
    return {
      ...fromField,
      x: field.layout?.x ?? oldItem?.x ?? fromField.x,
      y: field.layout?.y ?? oldItem?.y ?? fromField.y,
      w: field.colSpan ?? oldItem?.w ?? fromField.w,
    }
  })
}

function isSameLayout(a: Layout, b: Layout) {
  if (a.length !== b.length)
    return false

  return a.every((item, index) => {
    const next = b[index]
    return next
      && item.i === next.i
      && item.x === next.x
      && item.y === next.y
      && item.w === next.w
      && item.h === next.h
  })
}

function syncCanvasLayoutFromGrid(realItems: Layout) {
  const nextItems = new Map(realItems.map(item => [String(item.i), item]))
  const nextLayout = props.fields.map((field, index) => {
    const gridItem = nextItems.get(field._vid)
    const fallback = toLayoutItem(field, index)
    return {
      ...fallback,
      ...(gridItem ?? {}),
    }
  })

  if (!isSameLayout(canvasLayout.value, nextLayout)) {
    canvasLayout.value.splice(0, canvasLayout.value.length, ...nextLayout)
  }
}

watch(
  () => props.fields.map(field => `${field._vid}:${field.componentKey}:${field.colSpan}:${field.layout?.x ?? ''}:${field.layout?.y ?? ''}`).join('|'),
  () => {
    syncCanvasLayoutFromFields()
  },
  { immediate: true },
)

/** 合并字段布局 + 拖入占位项 */
const layout = computed<Layout>(() => {
  if (placeholderLayoutItem.value) {
    return [...canvasLayout.value, placeholderLayoutItem.value]
  }
  return canvasLayout.value
})

const fieldMap = computed(() => new Map(props.fields.map(field => [field._vid, field])))

/** 获取字段的实际标签宽度（字段级 > 表单级） */
function resolveLabelWidth(field: FormField): number {
  return field.labelWidth ?? props.formConfig.labelWidth
}

/** 获取字段的实际尺寸（字段级 > 表单级） */
function resolveSize(field: FormField): string {
  return field.size ?? props.formConfig.size
}

// ---- 内部网格拖拽 / 缩放回调 ----
function onLayoutUpdated(newLayout: Layout) {
  const realItems = newLayout.filter(item => item.i !== dropId)
  syncCanvasLayoutFromGrid(realItems)
  const sorted = [...realItems].sort((a, b) => a.y - b.y || a.x - b.x)
  const newOrder = sorted.map(item => String(item.i))
  const oldOrder = props.fields.map(f => f._vid)

  // 同步 colSpan
  for (const item of sorted) {
    const field = props.fields.find(f => f._vid === item.i)
    if (field) {
      const patch = {
        colSpan: Math.min(cols, Math.max(1, item.w)),
        layout: {
          x: Math.min(cols - 1, Math.max(0, item.x)),
          y: Math.max(0, item.y),
        },
      }
      if (
        field.colSpan !== patch.colSpan
        || field.layout?.x !== patch.layout.x
        || field.layout?.y !== patch.layout.y
      ) {
        emit('updateFieldLayout', String(item.i), patch)
      }
    }
  }

  // 同步顺序
  for (let i = 0; i < newOrder.length; i++) {
    if (newOrder[i] !== oldOrder[i]) {
      const movedVid = newOrder.find(
        v => !oldOrder.slice(0, i + 1).includes(v) || oldOrder.indexOf(v) > i,
      )
      if (movedVid) {
        const fromIdx = oldOrder.indexOf(movedVid)
        if (fromIdx !== i && fromIdx >= 0) {
          emit('moveField', fromIdx, i)
          break
        }
      }
    }
  }
}

// ---- 外部拖入网格：占位 + 定位 ----
const updatePlaceholder = throttle(() => {
  // drop / dragend 后可能仍有节流回调，避免再次点亮占位
  if (!isDragOver.value)
    return

  const parentRect = wrapper.value?.getBoundingClientRect()
  if (!parentRect || !gridLayout.value) {
    return
  }

  const mouseInGrid
    = mouseAt.x > parentRect.left
      && mouseAt.x < parentRect.right
      && mouseAt.y > parentRect.top
      && mouseAt.y < parentRect.bottom

  // 鼠标进入网格 → 创建占位
  const wasPlaceholderMissing = !placeholderLayoutItem.value
  if (mouseInGrid && wasPlaceholderMissing) {
    placeholderLayoutItem.value = {
      i: dropId,
      x: 0,
      y: props.fields.length + 12,
      w: 12,
      h: 1,
    }
  }

  if (placeholderLayoutItem.value) {
    const item = gridLayout.value.getItem(dropId)
    if (!item) {
      return
    }
    // 隐藏占位 DOM，仅用拖拽预览线表示位置
    try {
      item.wrapper.style.display = 'none'
    }
    catch {
      /* ignore */
    }

    Object.assign(item.state, {
      top: mouseAt.y - parentRect.top,
      left: mouseAt.x - parentRect.left,
    })
    const newPos = item.calcXY(mouseAt.y - parentRect.top, mouseAt.x - parentRect.left)

    if (mouseInGrid) {
      // 首次 dragstart，之后用 dragmove，避免多次 nextTick 把 isDragging 重新置 true
      gridLayout.value.dragEvent(
        wasPlaceholderMissing ? 'dragstart' : 'dragmove',
        dropId,
        newPos.x,
        newPos.y,
        1,
        12,
      )
    }
    else {
      gridLayout.value.dragEvent('dragend', dropId, newPos.x, newPos.y, 1, 12)
      placeholderLayoutItem.value = null
      clearGridDraggingFlag()
    }
  }
}, 16)

function onDragOverCanvas(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
  isDragOver.value = true
  updatePlaceholder()
}

function onDragLeaveCanvas() {
  isDragOver.value = false
}

function onDropCanvas(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = false

  const raw = event.dataTransfer?.getData('application/json')
  if (!raw) {
    clearDragArtifacts()
    return
  }

  try {
    const field: FormField = JSON.parse(raw)

    const dropLayout = placeholderLayoutItem.value
      ? {
          x: Math.min(cols - 1, Math.max(0, placeholderLayoutItem.value.x)),
          y: Math.max(0, placeholderLayoutItem.value.y),
        }
      : undefined

    if (placeholderLayoutItem.value && gridLayout.value) {
      gridLayout.value.dragEvent('dragend', dropId, 0, 0, 1, 12)
      placeholderLayoutItem.value = null
    }

    emit('addField', { ...field, layout: dropLayout }, props.fields.length)
    clearGridDraggingFlag()
  }
  catch (e) {
    clearDragArtifacts()
    console.error('[FormCanvas] drop parse error:', e)
  }
}

function onCanvasPointerDown(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  if (!target)
    return
  if (
    target.closest('.form-field-card')
    || target.closest('.vgl-item__resizer')
    || target.closest('.field-actions')
  ) {
    return
  }
  clearDragArtifacts()
  emit('select', null)
}
</script>

<template>
  <div
    ref="canvasRoot"
    class="form-canvas"
    :class="{ 'drag-active': isDragOver }"
    @dragover="onDragOverCanvas"
    @dragleave="onDragLeaveCanvas"
    @drop="onDropCanvas"
    @pointerdown.capture="onCanvasPointerDown"
  >
    <el-scrollbar height="100%" class="form-canvas__scrollbar">
      <div
        class="form-canvas-inner mx-auto w-full px-4 py-4"
        :style="viewportHeight > 0 ? { minHeight: `${viewportHeight}px` } : undefined"
      >
        <div
          ref="wrapper"
          class="form-canvas-body"
          :class="{ 'drag-hover': isDragOver }"
          :style="paperMinHeight ? { minHeight: paperMinHeight } : undefined"
        >
          <div
            v-if="fields.length === 0 && !placeholderLayoutItem"
            class="form-canvas-empty pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center"
          >
            <div class="form-canvas-empty__mark mb-4 flex h-14 w-14 items-center justify-center rounded-full">
              <el-icon :size="28" class="opacity-70">
                <Operation />
              </el-icon>
            </div>
            <p class="text-sm font-medium text-[var(--el-text-color-regular)]">
              把组件拖到这里
            </p>
            <p class="mt-1 text-xs text-[var(--el-text-color-placeholder)]">
              或在左侧点击添加字段
            </p>
          </div>

          <el-form
            class="form-canvas__form"
            :model="canvasModel"
            :label-width="`${formConfig.labelWidth}px`"
            :label-position="formConfig.labelPosition"
            :size="formConfig.size"
            :disabled="formConfig.disabled"
            :hide-required-asterisk="!formConfig.requiredAsterisk"
          >
            <GridLayout
              ref="gridLayout"
              class="relative z-[1]"
              :layout="layout"
              :col-num="cols"
              :row-height="80"
              :margin="[8, 8]"
              :is-draggable="true"
              :is-resizable="true"
              :vertical-compact="true"
              :prevent-collision="false"
              :use-css-transforms="true"
              @layout-updated="onLayoutUpdated"
              @update:layout="onLayoutUpdated"
            >
              <template #item="{ item }">
                <template v-if="fieldMap.get(String(item.i))">
                  <div
                    class="form-field-card group"
                    :class="{
                      'selected-card': activeFieldId === String(item.i),
                      'is-hidden-field': fieldMap.get(String(item.i))?.hidden,
                    }"
                    @click.stop="emit('select', String(item.i))"
                  >
                    <span class="drag-handle shrink-0 select-none text-[15px] leading-none text-[var(--fd-ink,var(--el-text-color-secondary))]">⠿</span>
                    <el-form-item
                      class="form-field-card__item"
                      :prop="fieldMap.get(String(item.i))?.field"
                      :label-width="`${resolveLabelWidth(fieldMap.get(String(item.i))!)}px`"
                      :required="fieldMap.get(String(item.i))?.required"
                    >
                      <template #label>
                        <span class="form-field-card__label">
                          {{ fieldMap.get(String(item.i))?.label }}{{ formConfig.labelSuffix || '' }}
                        </span>
                      </template>
                      <div class="form-field-card__control">
                        <FormFieldPreview :field="fieldMap.get(String(item.i))!" :size="resolveSize(fieldMap.get(String(item.i))!)" />
                      </div>
                    </el-form-item>
                    <div
                      class="field-actions absolute right-1.5 top-1.5 z-[2] gap-0.5"
                      :class="{
                        'flex': activeFieldId === String(item.i),
                        'hidden group-hover:flex': activeFieldId !== String(item.i),
                      }"
                    >
                      <el-button
                        text
                        :icon="Delete"
                        class="field-actions__delete"
                        @click.stop="emit('remove', String(item.i))"
                      />
                    </div>
                  </div>
                </template>
              </template>
            </GridLayout>
          </el-form>
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<style scoped>
.form-canvas {
  height: 100%;
  width: 100%;
  overflow: hidden;
  border-radius: 12px;
  background-color: var(--el-bg-color-page);
  background-image:
    linear-gradient(rgba(37, 99, 235, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(37, 99, 235, 0.035) 1px, transparent 1px),
    radial-gradient(circle, var(--fd-grid-dot, var(--el-fill-color-lighter)) 1px, transparent 1px);
  background-size:
    80px 80px,
    80px 80px,
    20px 20px;
}

.form-canvas__scrollbar {
  height: 100%;
  width: 100%;
}

.form-canvas :deep(.el-scrollbar__wrap) {
  height: 100% !important;
  max-height: 100% !important;
  overflow-x: hidden;
}

.form-canvas-inner {
  box-sizing: border-box;
  width: 100%;
  max-width: var(--fd-paper-max, 920px);
}

.form-canvas-body {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--fd-paper-edge, var(--el-border-color-light));
  background:
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--el-color-primary) 10%, transparent) 0,
      color-mix(in srgb, var(--el-color-primary) 10%, transparent) 3px,
      transparent 3px,
      transparent 100%
    ),
    var(--el-bg-color);
  box-shadow:
    0 1px 0 color-mix(in srgb, var(--el-color-primary) 8%, transparent),
    0 18px 46px rgba(31, 58, 112, 0.12);
}

.form-canvas-empty__mark {
  color: var(--el-color-primary);
  background: var(--fd-chip-bg, var(--el-fill-color-light));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 18%, transparent);
}

.form-field-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-height: 100%;
  padding: 10px 36px 10px 12px;
  cursor: pointer;
  user-select: none;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--fd-radius-sm, 6px);
  background: transparent;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease;
}

.form-field-card__item {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  margin-bottom: 0;
}

.form-field-card__item :deep(.el-form-item__label) {
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.form-field-card__item :deep(.el-form-item__content) {
  display: flex;
  align-items: center;
  min-width: 0;
}

.form-field-card__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.form-field-card__control {
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
  width: 100%;
}

.form-field-card .drag-handle {
  cursor: grab;
  line-height: 1;
}

.form-field-card:active .drag-handle {
  cursor: grabbing;
}

.form-field-card.is-hidden-field {
  opacity: 0.55;
}

.form-field-card:not(.selected-card):hover {
  border-color: color-mix(in srgb, var(--el-color-primary) 28%, transparent);
  background: color-mix(in srgb, var(--el-color-primary) 4%, var(--el-bg-color));
}

.form-field-card.selected-card {
  border-color: color-mix(in srgb, var(--el-color-primary) 55%, var(--el-border-color));
  background: var(--wc-active-fill, var(--el-color-primary-light-9));
  box-shadow: inset 3px 0 0 var(--fd-spine, var(--el-color-primary));
}

.form-field-card.selected-card .field-actions {
  display: flex !important;
}

.field-actions__delete:hover {
  color: var(--el-color-danger) !important;
}

:deep(.vgl-layout) {
  width: 100% !important;
  background: transparent;
  /* 不用实心底，避免残留时看起来像字段选中态 */
  --vgl-placeholder-bg: transparent;
  --vgl-placeholder-opacity: 1;
}

:deep(.vgl-item--placeholder) {
  border-radius: var(--fd-radius-sm, 6px);
  pointer-events: none;
  background-color: transparent !important;
  box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--el-color-primary) 45%, transparent);
}

:deep(.vgl-item--placeholder .vgl-item__resizer) {
  display: none !important;
}

:deep(.vgl-item) {
  display: flex !important;
  align-items: stretch;
}

:deep(.vgl-item > .form-field-card),
:deep(.vgl-item > div) {
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  min-height: 100%;
  height: 100%;
}

:deep(.vgl-item__resizer) {
  --vgl-resizer-border-color: color-mix(in srgb, var(--el-color-primary) 55%, transparent);
  --vgl-resizer-border-width: 1.5px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

/* 仅选中字段显示缩放角 */
:deep(.vgl-item:has(.form-field-card.selected-card) .vgl-item__resizer) {
  opacity: 1;
  pointer-events: auto;
}

.drag-active {
  outline: 1px dashed color-mix(in srgb, var(--el-color-primary) 55%, transparent);
  outline-offset: -2px;
}

.drag-hover {
  border-color: color-mix(in srgb, var(--el-color-primary) 45%, var(--el-border-color)) !important;
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--el-color-primary) 20%, transparent),
    var(--el-box-shadow-lighter);
}
</style>
