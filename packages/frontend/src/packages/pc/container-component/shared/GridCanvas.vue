<!--
  GridCanvas - 统一的内层网格画布容器

  用途：
  - 容器组件（container / layout / form / group）的插槽内容
  - 组（group）内部的子组件布局

  特点：
  - 基于网格度量（x/y/w/h 网格单位）
  - 使用共享 CanvasItem 进行单项的像素渲染 + 拖拽/缩放
  - 拖拽逻辑（平滑视觉 + 释放提交）统一
  - 拖拽鼠标样式统一为 grabbing 风格
  - 手柄外观与 GridLayoutPlus 一致
  - 列数（cols）固定（来自 colNum prop 或页面设计宽度），仅用实时宽度计算 colWidth。
    因此“放在最左/最右”的组件，在页面或容器宽度变化时会保持贴边（与 GridLayoutPlus 行为一致）。

  所有“外层画布容器”（插槽与组）都应使用此组件 + 网格坐标模型。
-->

<script lang="ts" setup>
import type { CSSProperties, PropType } from 'vue'
import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { useResizeObserver } from '@vueuse/core'
import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue'
import { ContainerEditorContextKey, EditingContainerIdKey } from '@/packages/pc/container-component/container'
import {
  calcSlotColLeft,
  calcSlotDropLayout,
  calcSlotRowTop,
  getSlotGridMetrics,
} from '@/packages/pc/container-component/shared/slot-grid.utils'
import { useControlStore } from '@/stores/controlStore'
import { generateNanoid } from '@/visual-editor/lib'
import ReferenceGuides from '@/visual-editor/ui/canvas/shared/ReferenceGuides.vue'
import { buildSnapTargets } from '@/visual-editor/ui/canvas/shared/snap'
import CompRender from '@/visual-editor/ui/canvas/simulator-grid-editor/comp-render'
import CanvasItem from './CanvasItem.vue'

const props = defineProps({
  children: {
    type: Array as PropType<VisualEditorBlockData[]>,
    default: (): VisualEditorBlockData[] => [],
  },
  slotKey: {
    type: String,
    default: '',
  },
  colNum: {
    type: Number,
    default: 0, // 0 表示让 GridCanvas 根据测量宽度或显式传入决定（1px 步长下推荐）
  },
  rowHeight: {
    type: Number,
    default: 1,
  },
  parentFocus: {
    type: Boolean,
    default: false,
  },
  containerVid: {
    type: String,
    default: '',
  },
  isEditing: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:children', 'drag-enter', 'drag-leave', 'drop'])

const controlStore = useControlStore()
let currentPageRef: any = { value: null }
try {
  // useVisualData 依赖 editor 上下文的 provide，在画布内可用
  const vd = useVisualData()
  currentPageRef = vd.currentPage
}
catch {}
const currentPage = currentPageRef
const editorCtx = inject(ContainerEditorContextKey, null)
const editingContainerId = inject(EditingContainerIdKey, ref<string | null>(null))

/** 直接读取画布注入的编辑态，避免 h() 传参快照滞后 */
const isEditingMode = computed(() =>
  props.isEditing || (Boolean(props.containerVid) && editingContainerId.value === props.containerVid),
)

const canvasRef = ref<HTMLElement>()
const emptyRef = ref<HTMLElement>()
const slotWidth = ref(0)
const slotHeight = ref(0)

useResizeObserver(canvasRef, (entries) => {
  const rect = entries[0]?.contentRect
  slotWidth.value = rect?.width ?? 0
  slotHeight.value = rect?.height ?? 0
})

onMounted(() => {
  if (canvasRef.value) {
    slotWidth.value = canvasRef.value.clientWidth
    slotHeight.value = canvasRef.value.clientHeight
  }
})

onBeforeUnmount(() => {
  // 拖拽监听已移至共享 CanvasItem 组件
})

/**
 * 列数（1px 步长）：
 * - 优先使用显式 props.colNum（组传入合并时的跨度单位数 = 像素跨度）
 * - 否则使用当前测量的容器宽度作为列数（实现内部 1px 网格）
 * - 最后回退到页面设计宽度
 * - 仅使用测量宽度计算 colWidth（宽度变化时内容按比例贴边）
 */
const effectiveColNum = computed(() => {
  const n = Number(props.colNum)
  if (n && n > 0) {
    return Math.floor(n)
  }
  if (slotWidth.value > 0) {
    return Math.max(1, Math.floor(slotWidth.value))
  }
  const designWidth = currentPage.value?.config?.pageSize?.width || 1920
  return Math.max(1, Math.floor(designWidth))
})

const slotMetrics = computed(() => {
  const w = slotWidth.value > 0 ? slotWidth.value : effectiveColNum.value
  return getSlotGridMetrics(w, effectiveColNum.value)
})

const localChildren = computed({
  get: () => props.children || [],
  set: val => emit('update:children', val),
})

// ---- Reference guides + snapping state ----
const activeDrag = ref<{ vid: string, left: number, top: number, width: number, height: number } | null>(null)
const activeResize = ref<{ vid: string, left: number, top: number, width: number, height: number } | null>(null)

function getBaseRectForVid(vid: string) {
  const child = localChildren.value.find(c => c._vid === vid)
  return child ? getItemPixelRect(child) : { left: 0, top: 0, width: 20, height: 20 }
}

function onDragStart(child: VisualEditorBlockData) {
  // Seed the rect from base so guides can appear as soon as movement starts
  if (!isEditingMode.value) {
    return
  }
  const r = getItemPixelRect(child)
  activeDrag.value = {
    vid: child._vid,
    left: r.left,
    top: r.top,
    width: r.width,
    height: r.height,
  }
  activeResize.value = null
}

function onDragUpdate(child: VisualEditorBlockData, pos: { left: number, top: number }) {
  if (!isEditingMode.value) {
    return
  }
  activeResize.value = null
  const base = getBaseRectForVid(child._vid)
  if (!activeDrag.value || activeDrag.value.vid !== child._vid) {
    activeDrag.value = {
      vid: child._vid,
      left: pos.left,
      top: pos.top,
      width: base.width,
      height: base.height,
    }
  }
  else {
    activeDrag.value.left = pos.left
    activeDrag.value.top = pos.top
  }
}

function clearActiveDrag() {
  activeDrag.value = null
  activeResize.value = null
}

function _clearActiveResize() {
  activeResize.value = null
}

// Unified for guides
const guideRect = computed(() => activeDrag.value || activeResize.value)
const isGuideVisible = computed(() => !!guideRect.value)

// Other rects (exclude whichever is active)
const otherRectsForGuides = computed(() => {
  const activeVid = guideRect.value?.vid
  if (!activeVid) {
    return localChildren.value.map(c => getItemPixelRect(c))
  }
  return localChildren.value
    .filter(c => c._vid !== activeVid)
    .map(c => getItemPixelRect(c))
})

// Snap targets derived from other rects + container bounds + centers
const snapTargets = computed(() => {
  return buildSnapTargets(otherRectsForGuides.value, slotWidth.value || 0, slotHeight.value || 0)
})

/**
 * Local desired min-height for this slot's content area.
 * Lets children be placed/dragged lower than the "natural" container slot height.
 * When the outer container block is tall enough (or user resizes it), lower content becomes visible.
 */
const localContentMinHeight = computed(() => {
  const m = slotMetrics.value
  let maxB = Math.max(300, slotHeight.value || 300)
  localChildren.value.forEach((c) => {
    const bottom = calcSlotRowTop((c.y || 0) + (c.h || 4), m) + 120
    if (bottom > maxB) maxB = bottom
  })
  // Consider live guide rect (drag inside this canvas)
  if (guideRect.value) {
    const liveB = guideRect.value.top + guideRect.value.height + 80
    if (liveB > maxB) maxB = liveB
  }
  return Math.ceil(maxB)
})

function isBlockSelected(vid: string) {
  return editorCtx?.selectedBlockIds.value.includes(vid) ?? false
}

/** 子项是否因父容器锁定而不可拖拽（进入编辑模式时锁定外层） */
function isChildGridLocked(block: VisualEditorBlockData | undefined) {
  if (!block)
    return false
  if (block.static || block._containerEditLocked)
    return true
  if (editingContainerId.value && block._vid === editingContainerId.value)
    return true
  return false
}

function canInteract(block: VisualEditorBlockData | undefined) {
  return isEditingMode.value && !isChildGridLocked(block)
}

function _parsePx(value: string | number | undefined, fallback = 0) {
  return Number.parseInt(String(value ?? ''), 10) || fallback
}

/** 根据当前槽的网格度量计算子项的像素矩形（与根画布完全一致的公式） */
function getItemPixelRect(block: VisualEditorBlockData) {
  const m = slotMetrics.value
  const left = calcSlotColLeft(block.x ?? 0, m)
  const top = calcSlotRowTop(block.y ?? 0, m)
  const right = calcSlotColLeft((block.x ?? 0) + (block.w ?? 4), m)
  const bottom = calcSlotRowTop((block.y ?? 0) + (block.h ?? 2), m)
  return {
    left,
    top,
    width: Math.max(1, right - left - m.margin[0]),
    height: Math.max(1, bottom - top - m.margin[1]),
  }
}

function getBlockStyle(block: VisualEditorBlockData): CSSProperties {
  const styles = block.styles || {}
  return {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    ...styles,
  }
}

function handleSelect(block: VisualEditorBlockData | undefined, e: MouseEvent) {
  if (!block || !isEditingMode.value)
    return
  e.stopPropagation()
  if (editorCtx)
    editorCtx.selectComp(block, e)
  else
    controlStore.selectCanvasBlock(block)
}

function handleContextmenu(block: VisualEditorBlockData | undefined, e: MouseEvent) {
  if (!block || !isEditingMode.value)
    return
  e.preventDefault()
  e.stopPropagation()
  if (editorCtx)
    editorCtx.onContextmenuBlock(e, block, localChildren.value)
}

function handleDragEnter(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  emit('drag-enter', e)
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  emit('drag-leave', e)
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
}

function handleCanvasMousedown(e: MouseEvent) {
  const target = e.target as HTMLElement
  const onItem = Boolean(target.closest('.canvas-item')) // CanvasItem 现在是统一 item

  if (!isEditingMode.value) {
    e.stopPropagation()
    if (props.containerVid)
      editorCtx?.selectContainerByVid?.(props.containerVid, e)
    return
  }

  // 编辑模式下点击子项时不拦截，由子项自己处理拖拽
  if (onItem)
    return

  e.stopPropagation()
  if (props.containerVid)
    editorCtx?.selectContainerByVid?.(props.containerVid, e)
}

function handleCanvasPointerdown(e: PointerEvent) {
  if (!isEditingMode.value)
    return
  // 编辑模式下阻止冒泡到外层 grid-layout，避免 interact 抢事件
  e.stopPropagation()
}

/** Capture phase stop: cuts off ancestor listeners (including outer interact.js) as early as possible */
function handleCanvasPointerdownCapture(e: PointerEvent) {
  if (isEditingMode.value) {
    e.stopPropagation()
  }
}

function handleContainerDblClick(e: MouseEvent) {
  if (isEditingMode.value)
    return
  e.stopPropagation()
  if (!props.containerVid)
    return
  editorCtx?.enterContainerEditMode?.(props.containerVid)
  editorCtx?.selectContainerByVid?.(props.containerVid, e)
}

const NESTED_CONTAINER_KEYS = new Set(['group', 'container', 'layout', 'form'])

function handleInnerContainerDblClick(block: VisualEditorBlockData | undefined, e: MouseEvent) {
  if (!block)
    return
  e.stopPropagation()

  const isNestedContainer = NESTED_CONTAINER_KEYS.has(block.componentKey)

  // Prefer direct entry into a nested group/container when dblclicked (common expectation)
  if (isNestedContainer) {
    editorCtx?.enterContainerEditMode?.(block._vid)
    editorCtx?.selectContainerByVid?.(block._vid, e)
    return
  }

  if (!isEditingMode.value) {
    // Double-click non-container child (or canvas bg) when not editing → enter the current slot's container
    if (props.containerVid) {
      editorCtx?.enterContainerEditMode?.(props.containerVid)
      editorCtx?.selectContainerByVid?.(props.containerVid, e)
    }
    return
  }

  // Already editing this layer, non-container child dblclick does nothing special here
}

// ---- 共享 CanvasItem 拖拽/缩放结束回调（像素值），此处负责转网格并提交
function onItemDragEnd(child: VisualEditorBlockData, pos: { left: number, top: number }) {
  clearActiveDrag()
  if (!isEditingMode.value)
    return
  const m = slotMetrics.value
  const w = child.w ?? 4
  const maxX = Math.max(0, m.cols - w)

  const newX = Math.max(0, Math.min(maxX, Math.round(pos.left / m.colWidth)))
  const newY = Math.max(0, Math.round(pos.top / m.rowHeight))

  child.x = newX
  child.y = newY

  localChildren.value = [...localChildren.value]
  editorCtx?.recordHistory()
}

function onItemResizeStart(child: VisualEditorBlockData) {
  if (!isEditingMode.value) {
    return
  }
  activeDrag.value = null
  const r = getItemPixelRect(child)
  activeResize.value = {
    vid: child._vid,
    left: r.left,
    top: r.top,
    width: r.width,
    height: r.height,
  }
}

function onItemResizeUpdate(child: VisualEditorBlockData, size: { width: number, height: number }) {
  if (!isEditingMode.value) {
    return
  }
  activeDrag.value = null
  const base = getBaseRectForVid(child._vid)
  if (!activeResize.value || activeResize.value.vid !== child._vid) {
    activeResize.value = {
      vid: child._vid,
      left: base.left,
      top: base.top,
      width: size.width,
      height: size.height,
    }
  }
  else {
    activeResize.value.width = size.width
    activeResize.value.height = size.height
  }
}

function onItemResizeEnd(child: VisualEditorBlockData, size: { width: number, height: number }) {
  clearActiveDrag()
  if (!isEditingMode.value)
    return
  const m = slotMetrics.value
  const x = child.x ?? 0
  const maxW = Math.max(1, m.cols - x)

  const newW = Math.max(1, Math.min(maxW, Math.round(size.width / m.colWidth)))
  const newH = Math.max(1, Math.round(size.height / m.rowHeight))

  child.w = newW
  child.h = newH

  localChildren.value = [...localChildren.value]
  editorCtx?.recordHistory()
}

// ---- 拖放处理 ----
// Palette drops (from component list) are now centralized in PcWrapper dragEnd + findSlotContextAtPoint.
// This avoids duplicate insertion and ensures consistent cross-container / into-closed-container behavior.
function handleDrop(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()

  const block = controlStore.moveVisualData
  if (!block)
    return

  if (!isEditingMode.value)
    emit('drop', e)

  // For palette from list: let root PcWrapper's dragEnd decide (using improved slot detection)
  // and insert into the correct slot's children (works for both open and closed containers).
  // Internal block moves inside an editing container are handled via CanvasItem @drag-end etc.
  // If this was triggered by other native drags while editing, we still allow direct insert as fallback.
  if (!isEditingMode.value) {
    // closed container: root will handle palette placement via slotCtx
    return
  }

  // When editing: still delegate palette-from-list to root dragEnd (which will locate this slot via findSlot
  // and push into the same children array). This keeps a single decision path and avoids dupes.
  // (CanvasItem internal drags handle repositioning of existing children inside this canvas.)
  return
}

/** 适配 CanvasItem 发出的 mousedown（非编辑态下点击子项选中容器） */
function handleItemMouseDown(e: MouseEvent, _child?: VisualEditorBlockData) {
  if (!isEditingMode.value) {
    if (props.containerVid) {
      editorCtx?.selectContainerByVid?.(props.containerVid, e)
    }
    e.stopPropagation()
  }
}
</script>

<template>
  <!-- 保留旧 class 以兼容现有样式选择器 -->
  <div
    ref="canvasRef"
    class="grid-canvas slot-grid-canvas"
    :data-slot-key="slotKey"
    :data-col-num="effectiveColNum"
    :class="{
      'is-editing': isEditingMode,
      'is-focused': parentFocus && !isEditingMode,
    }"
    @dragenter.prevent="handleDragEnter"
    @dragleave.prevent="handleDragLeave"
    @dragover.prevent="handleDragOver"
    @drop.prevent="handleDrop"
    @mousedown="handleCanvasMousedown"
    @pointerdown="handleCanvasPointerdown"
    @pointerdown.capture="handleCanvasPointerdownCapture"
    @dblclick.stop="handleContainerDblClick"
  >
    <!-- 统一网格布局（使用共享 CanvasItem） -->
    <div
      v-if="localChildren.length > 0"
      class="grid-layout slot-grid-layout"
      :class="{ 'is-editing': isEditingMode }"
      :style="isEditingMode ? { minHeight: localContentMinHeight + 'px' } : undefined"
    >
      <!-- Reference / alignment guides overlay (drag or resize) -->
      <ReferenceGuides
        :container-width="slotWidth"
        :container-height="slotHeight"
        :other-rects="otherRectsForGuides"
        :active-rect="guideRect"
        :visible="isGuideVisible"
        :threshold="6"
      />

      <CanvasItem
        v-for="child in localChildren"
        :key="child._vid"
        :vid="child._vid"
        :left="getItemPixelRect(child).left"
        :top="getItemPixelRect(child).top"
        :width="getItemPixelRect(child).width"
        :height="getItemPixelRect(child).height"
        :is-editing="isEditingMode"
        :is-selected="isBlockSelected(child._vid)"
        :is-focused="child.focus"
        :disabled="!canInteract(child)"
        item-class="slot-grid-item"
        :snap-x-lines="snapTargets.xs"
        :snap-y-lines="snapTargets.ys"
        :snap-threshold="6"
        :container-width="slotWidth"
        @mousedown="(e: MouseEvent) => handleItemMouseDown(e, child)"
        @select="handleSelect(child, $event)"
        @contextmenu="handleContextmenu(child, $event)"
        @dblclick="handleInnerContainerDblClick(child, $event)"
        @drag-start="onDragStart(child)"
        @drag-update="onDragUpdate(child, $event)"
        @drag-end="onItemDragEnd(child, $event)"
        @resize-start="onItemResizeStart(child)"
        @resize-update="onItemResizeUpdate(child, $event)"
        @resize-end="onItemResizeEnd(child, $event)"
      >
        <div
          class="slot-block-wrapper"
          :class="{ 'is-editing': isEditingMode }"
          :style="getBlockStyle(child)"
        >
          <CompRender
            :element="child"
            :style="{ pointerEvents: 'none' }"
          />
        </div>
      </CanvasItem>
    </div>

    <!-- 空状态 -->
    <div
      v-else
      ref="emptyRef"
      class="grid-empty slot-grid-empty"
      @dragenter.prevent="handleDragEnter"
      @dragleave.prevent="handleDragLeave"
      @dragover.prevent="handleDragOver"
      @drop.prevent="handleDrop"
    >
      <span class="empty-text">
        {{ isEditingMode ? '拖入组件' : '双击容器进入编辑模式' }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.grid-canvas,
.slot-grid-canvas {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: transparent;
  pointer-events: auto;

  &:not(.is-editing) {
    .grid-layout,
    .slot-grid-layout,
    .slot-grid-item,
    .canvas-item {
      pointer-events: none;
    }

    .grid-empty,
    .slot-grid-empty {
      pointer-events: auto;
    }
  }

  &.is-editing {
    .grid-layout,
    .slot-grid-layout,
    .slot-grid-item,
    .canvas-item {
      pointer-events: auto;
    }

    // 编辑态提升层级，优先接收事件，避免外层 grid-layout interact 干扰
    z-index: 20;

    /* Allow children placed lower than the container's current box to be visible (canvas can visually extend) */
    overflow: visible;
  }

  &.is-focused {
    .slot-grid-empty,
    .grid-empty {
      background: #f0f7ff;
      border-color: #409eff;

      .empty-text {
        color: #409eff;
      }
    }
  }
}

.grid-layout,
.slot-grid-layout {
  position: relative;
  width: 100%;
  /* Base; when editing we bind a larger min-height inline so children can be placed lower */
  min-height: 200px;
}

.grid-empty,
.slot-grid-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #dcdfe6;
  background: #fafafa;
  pointer-events: auto;

  .empty-text {
    color: #909399;
    font-size: 12px;
  }
}

/* 具体 item 样式由共享 CanvasItem 提供（grab/grabbing、选中描边、resizer 等）。
   .slot-grid-item 作为附加类保留，用于特定覆盖。 */
.slot-grid-item {
  /* 过渡在 CanvasItem 中禁用以追求即时响应 */
}
</style>
