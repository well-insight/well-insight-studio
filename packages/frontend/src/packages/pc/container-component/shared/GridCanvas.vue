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
import { cloneDeep } from 'lodash-es'
import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue'
import { ContainerEditorContextKey, EditingContainerIdKey } from '@/packages/pc/container-component/container'
import {
  calcSlotColLeft,
  calcSlotDropLayout,
  calcSlotRowTop,
  getSlotGridMetrics,
} from '@/packages/pc/container-component/shared/slot-grid.utils'
import { useControlStore } from '@/stores/controlStore'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import { generateNanoid } from '@/visual-editor/lib'
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
    default: 12,
  },
  rowHeight: {
    type: Number,
    default: 15,
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

useResizeObserver(canvasRef, (entries) => {
  slotWidth.value = entries[0]?.contentRect.width ?? 0
})

onMounted(() => {
  if (canvasRef.value)
    slotWidth.value = canvasRef.value.clientWidth
})

onBeforeUnmount(() => {
  // 拖拽监听已移至共享 CanvasItem 组件
})

/**
 * 稳定的列数（fixed cols），与 GridLayoutPlus 行为一致：
 * - 优先使用 props.colNum（各容器传入的固定值，如 12）
 * - 回退时使用与根画布相同的“按页面设计宽度计算”的列数
 * - 仅 containerWidth（实时测量）用于计算 colWidth，实现宽度变化时左/右贴边。
 */
const effectiveColNum = computed(() => {
  const n = Number(props.colNum)
  if (n && n > 0) {
    return Math.floor(n)
  }
  // 与 PcWrapper.gridColNum 一致的回退
  const designWidth = currentPage.value?.config?.pageSize?.width || 1920
  return Math.max(1, Math.floor(designWidth / 15))
})

const slotMetrics = computed(() => {
  const w = slotWidth.value > 0 ? slotWidth.value : effectiveColNum.value * 15
  return getSlotGridMetrics(w, effectiveColNum.value)
})

const localChildren = computed({
  get: () => props.children || [],
  set: val => emit('update:children', val),
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
  if (!isEditingMode.value) {
    // 双击子项进入当前容器编辑模式（无论子项是否为嵌套容器）
    if (props.containerVid)
      editorCtx?.enterContainerEditMode?.(props.containerVid)
    editorCtx?.selectContainerByVid?.(props.containerVid, e)
    return
  }
  if (!NESTED_CONTAINER_KEYS.has(block.componentKey))
    return
  editorCtx?.enterContainerEditMode?.(block._vid)
  editorCtx?.selectContainerByVid?.(block._vid, e)
}

// ---- 共享 CanvasItem 拖拽/缩放结束回调（像素值），此处负责转网格并提交
function onItemDragEnd(child: VisualEditorBlockData, pos: { left: number, top: number }) {
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

function onItemResizeEnd(child: VisualEditorBlockData, size: { width: number, height: number }) {
  if (!isEditingMode.value)
    return
  const m = slotMetrics.value
  const x = child.x ?? 0
  const maxW = m.cols - x

  const newW = Math.max(1, Math.min(maxW, Math.round(size.width / m.colWidth)))
  const newH = Math.max(1, Math.round(size.height / m.rowHeight))

  child.w = newW
  child.h = newH

  localChildren.value = [...localChildren.value]
  editorCtx?.recordHistory()
}

// ---- 拖放处理 ----
function handleDrop(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()

  const block = controlStore.moveVisualData
  if (!block)
    return

  if (!isEditingMode.value)
    emit('drop', e)

  const dropTarget = (canvasRef.value ?? emptyRef.value) as HTMLElement | undefined
  if (!dropTarget)
    return

  const dropRoot = (dropTarget.closest('.grid-canvas') ?? dropTarget) as HTMLElement
  const { x: gridX, y: gridY, w, h } = calcSlotDropLayout(dropRoot, e.clientX, e.clientY, block, effectiveColNum.value)

  const copiedBlock = cloneDeep(block) as VisualEditorBlockData
  copiedBlock._vid = `vid_${generateNanoid()}`
  copiedBlock.i = copiedBlock._vid
  copiedBlock.x = gridX
  copiedBlock.y = gridY
  copiedBlock.w = w
  copiedBlock.h = h
  copiedBlock.focus = false
  copiedBlock.focusWithChild = false

  localChildren.value = [...localChildren.value, copiedBlock]
  controlStore.setMoveVisualData(null)
  editorCtx?.recordHistory()
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
    >
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
        @mousedown="(e: MouseEvent) => handleItemMouseDown(e, child)"
        @select="handleSelect(child, $event)"
        @contextmenu="handleContextmenu(child, $event)"
        @dblclick="handleInnerContainerDblClick(child, $event)"
        @drag-end="onItemDragEnd(child, $event)"
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
  min-height: 100%;
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
