<script lang="ts" setup>
import type { FormField, FormSchema } from '../../types'
import type { Layout, LayoutItem } from '@/components/grid-layout-plus'
import { Delete, Link, Operation } from '@element-plus/icons-vue'
import { throttle } from '@vexip-ui/utils'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { GridLayout } from '@/components/grid-layout-plus'
import { getFormComponent } from '../../form-component-registry'

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
  canvasResizeObserver?.disconnect()
  canvasResizeObserver = null
})

// ---- 网格引用与占位 ----
const wrapper = ref<HTMLElement>()
const gridLayout = ref<InstanceType<typeof GridLayout>>()
const placeholderLayoutItem = ref<LayoutItem | null>(null)
const canvasLayout = ref<Layout>([])

type FormLayoutItem = LayoutItem & {
  dragAllowFrom?: string
  resizeIgnoreFrom?: string
}

function toLayoutItem(field: FormField, index: number): FormLayoutItem {
  return {
    i: field._vid,
    x: Math.min(cols - 1, Math.max(0, field.layout?.x ?? 0)),
    y: Math.max(0, field.layout?.y ?? index),
    w: Math.min(cols, Math.max(1, field.colSpan || cols)),
    h: 1,
    minW: 1,
    maxW: cols,
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
  () => props.fields.map(field => `${field._vid}:${field.colSpan}:${field.layout?.x ?? ''}:${field.layout?.y ?? ''}`).join('|'),
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
  if (mouseInGrid && !placeholderLayoutItem.value) {
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
      gridLayout.value.dragEvent('dragstart', dropId, newPos.x, newPos.y, 1, 12)
    }
    else {
      gridLayout.value.dragEvent('dragend', dropId, newPos.x, newPos.y, 1, 12)
      placeholderLayoutItem.value = null
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
    placeholderLayoutItem.value = null
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
  }
  catch (e) {
    placeholderLayoutItem.value = null
    console.error('[FormCanvas] drop parse error:', e)
  }
}

// ---- 字段预览 ----
function getFieldPreview(field: FormField) {
  const comp = getFormComponent(field.componentKey)
  return {
    label: field.label || comp?.label || '字段',
    placeholder: field.placeholder || '请输入',
  }
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
  >
    <el-scrollbar height="100%" class="form-canvas__scrollbar">
      <div
        class="form-canvas-inner mx-auto w-full max-w-[860px] px-4 py-4"
        :style="viewportHeight > 0 ? { minHeight: `${viewportHeight}px` } : undefined"
      >
        <div
          ref="wrapper"
          class="form-canvas-body rounded-[12px] border border-[var(--el-border-color-light)] bg-[var(--el-bg-color)] p-6 shadow-[var(--el-box-shadow-lighter)]"
          :class="{ 'drag-hover': isDragOver }"
          :style="paperMinHeight ? { minHeight: paperMinHeight } : undefined"
          @click="emit('select', null)"
        >
          <div
            v-if="fields.length === 0 && !placeholderLayoutItem"
            class="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center text-[var(--el-text-color-placeholder)]"
          >
            <el-icon :size="48" class="mb-3 opacity-30">
              <Operation />
            </el-icon>
            <p class="text-sm">
              拖拽或点击组件开始构建表单
            </p>
          </div>

          <GridLayout
            ref="gridLayout"
            class="relative z-[1]"
            :layout="layout"
            :col-num="cols"
            :row-height="72"
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
                  class="form-field-card group relative h-full cursor-pointer rounded-[8px] border px-3 py-2"
                  :class="{
                    'selected-card border-[var(--el-color-primary)] bg-[var(--wc-active-fill,var(--el-color-primary-light-9))]': activeFieldId === String(item.i),
                    'border-transparent hover:border-[var(--el-color-primary-light-5)]': activeFieldId !== String(item.i),
                    'opacity-60': fieldMap.get(String(item.i))?.hidden,
                  }"
                  @click.stop="emit('select', String(item.i))"
                >
                  <div class="flex items-center gap-2">
                    <span class="drag-handle shrink-0 cursor-grab text-lg font-bold text-[var(--el-text-color-secondary)]">⠿</span>
                    <label class="shrink-0 text-xs font-medium text-[var(--el-text-color-primary)]">
                      {{ fieldMap.get(String(item.i))?.label }}<span v-if="fieldMap.get(String(item.i))?.required" class="text-[var(--el-color-danger)]">*</span>
                      <el-icon
                        v-if="fieldMap.get(String(item.i))?.datasetBinding"
                        :size="12"
                        class="ml-1 inline-block text-[var(--el-color-success)]"
                        title="已绑定数据集"
                      ><Link /></el-icon>
                    </label>
                    <div class="min-w-0 flex-1">
                      <div
                        class="rounded border border-dashed border-[var(--el-border-color)] bg-[var(--el-fill-color-light)] px-2 py-1 text-xs text-[var(--el-text-color-placeholder)]"
                      >
                        {{ getFieldPreview(fieldMap.get(String(item.i))!).placeholder }}
                      </div>
                    </div>
                  </div>
                  <div
                    class="field-actions absolute right-1 top-1 gap-0.5"
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
  background-color: var(--el-bg-color-page);
  background-image:
    radial-gradient(circle, var(--el-fill-color-lighter) 1px, transparent 1px);
  background-size: 16px 16px;
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
}

.form-canvas-body {
  position: relative;
  box-sizing: border-box;
  width: 100%;
}

.form-field-card {
  user-select: none;
  background: var(--el-bg-color);
  height: 100%;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.form-field-card .drag-handle {
  cursor: grab;
}

.form-field-card:active .drag-handle {
  cursor: grabbing;
}

.form-field-card.selected-card {
  position: relative;
  box-shadow: var(--el-box-shadow-lighter);
}

.form-field-card.selected-card::before {
  content: '';
  position: absolute;
  left: -1px;
  top: 6px;
  bottom: 6px;
  width: 3px;
  border-radius: 2px;
  background: var(--el-color-primary);
}

.form-field-card.selected-card .field-actions {
  display: flex !important;
}

.form-field-card:not(.selected-card):hover {
  transform: translateY(-1px);
  box-shadow: var(--el-box-shadow-lighter);
  background: var(--el-fill-color-blank);
}

.field-actions__delete:hover {
  color: var(--el-color-danger) !important;
}

:deep(.vgl-layout) {
  width: 100% !important;
  background: transparent;
}

.drag-active {
  outline: 2px dashed var(--el-color-primary);
  outline-offset: -2px;
}

.drag-hover {
  border-color: var(--el-color-primary) !important;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 22%, transparent);
}
</style>
