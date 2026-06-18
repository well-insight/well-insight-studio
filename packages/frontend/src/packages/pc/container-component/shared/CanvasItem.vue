<script lang="ts" setup>
import type { CSSProperties, PropType } from 'vue'
import { onBeforeUnmount, ref } from 'vue'
import { snapDrag, snapResizeSE } from '@/visual-editor/ui/canvas/shared/snap'

const props = defineProps({
  vid: {
    type: String,
    default: '',
  },
  left: {
    type: Number,
    default: 0,
  },
  top: {
    type: Number,
    default: 0,
  },
  width: {
    type: Number,
    default: 100,
  },
  height: {
    type: Number,
    default: 100,
  },
  isEditing: {
    type: Boolean,
    default: false,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
  isFocused: {
    type: Boolean,
    default: false,
  },
  /** 禁止交互（锁定） */
  disabled: {
    type: Boolean,
    default: false,
  },
  /** 额外类名 */
  itemClass: {
    type: [String, Object, Array] as PropType<string | Record<string, boolean> | string[]>,
    default: '',
  },
  /** Snap target X lines (vertical guides) */
  snapXLines: {
    type: Array as PropType<number[]>,
    default: () => [] as number[],
  },
  /** Snap target Y lines (horizontal guides) */
  snapYLines: {
    type: Array as PropType<number[]>,
    default: () => [] as number[],
  },
  /** Pixel threshold for snapping */
  snapThreshold: {
    type: Number,
    default: 8,
  },
  /**
   * Whether to render the built-in selection outline (blue) when isSelected or isFocused.
   * Set to false when the inner content (e.g. .list-group-item) already provides its own
   * richer selection visuals via ::after (focus / multi-focus / focusWithChild).
   */
  showSelectionOutline: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits([
  'mousedown',
  'select',
  'contextmenu',
  'dblclick',
  'drag-start',
  'drag-update', // live during drag for guides (snapped)
  'drag-end',
  'resize-start',
  'resize-update', // live during resize for guides + snapping (snapped)
  'resize-end',
])

// 内部拖拽视觉状态（平滑跟随，不在移动中直接提交数据）
const dragVisual = ref<{ left: number, top: number } | null>(null)
const resizeVisual = ref<{ width: number, height: number } | null>(null)

const dragging = ref(false)
const resizing = ref(false)
const hasMoved = ref(false)

const dragStartPos = ref({ x: 0, y: 0 })
const dragStartRect = ref({ left: 0, top: 0 })
const resizeStartPos = ref({ x: 0, y: 0 })
const resizeStartSize = ref({ width: 0, height: 0 })

function _parsePx(value: string | number | undefined, fallback = 0) {
  return Number.parseInt(String(value ?? ''), 10) || fallback
}

/** 当前生效的像素样式（基础 + 拖拽/缩放视觉覆盖） */
function getStyle(): CSSProperties {
  let l = props.left
  let t = props.top
  let w = props.width
  let h = props.height

  if (dragVisual.value) {
    l = dragVisual.value.left
    t = dragVisual.value.top
  }
  if (resizeVisual.value) {
    w = resizeVisual.value.width
    h = resizeVisual.value.height
  }

  return {
    position: 'absolute',
    left: `${l}px`,
    top: `${t}px`,
    width: `${w}px`,
    height: `${h}px`,
    margin: '0',
    padding: '0',
    boxSizing: 'border-box',
    overflow: 'hidden',
  }
}

function shouldShowResizer() {
  return props.isEditing && (props.isSelected || props.isFocused) && !props.disabled
}

// ---- Drag ----
function onMouseDown(e: MouseEvent) {
  emit('mousedown', e)

  if (!props.isEditing || props.disabled) {
    return
  }

  emit('select', e)
  e.preventDefault()
  e.stopPropagation()

  dragging.value = true
  hasMoved.value = false
  dragStartPos.value = { x: e.clientX, y: e.clientY }
  dragStartRect.value = { left: props.left, top: props.top }

  dragVisual.value = {
    left: props.left,
    top: props.top,
  }
  resizeVisual.value = null

  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)

  emit('drag-start')
}

function onMouseMove(e: MouseEvent) {
  if (!dragging.value || !dragVisual.value)
    return

  const dx = e.clientX - dragStartPos.value.x
  const dy = e.clientY - dragStartPos.value.y

  if (dx === 0 && dy === 0 && !hasMoved.value)
    return

  hasMoved.value = true

  let newLeft = dragStartRect.value.left + dx
  let newTop = dragStartRect.value.top + dy

  // Apply snapping if targets provided
  const targets = {
    xs: props.snapXLines || [],
    ys: props.snapYLines || [],
  }
  if ((targets.xs.length || targets.ys.length) && props.snapThreshold > 0) {
    const snap = snapDrag(
      {
        left: newLeft,
        top: newTop,
        width: props.width,
        height: props.height,
      },
      targets,
      props.snapThreshold,
    )
    newLeft += snap.dx
    newTop += snap.dy
  }

  // Light clamp to avoid negative during live drag (parent grid will further constrain on commit)
  newLeft = Math.max(0, newLeft)
  newTop = Math.max(0, newTop)

  dragVisual.value = { left: newLeft, top: newTop }

  emit('drag-update', { left: newLeft, top: newTop })
}

function onMouseUp() {
  if (dragging.value && hasMoved.value && dragVisual.value) {
    emit('drag-end', {
      left: dragVisual.value.left,
      top: dragVisual.value.top,
    })
  }

  dragging.value = false
  hasMoved.value = false
  dragVisual.value = null

  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
}

// ---- Resize ----
function onResizeStart(e: MouseEvent) {
  if (!props.isEditing || props.disabled || e.button !== 0)
    return

  e.preventDefault()
  e.stopPropagation()
  emit('select', e)

  resizing.value = true
  hasMoved.value = false
  resizeStartPos.value = { x: e.clientX, y: e.clientY }
  resizeStartSize.value = { width: props.width, height: props.height }

  resizeVisual.value = {
    width: props.width,
    height: props.height,
  }
  dragVisual.value = null

  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeUp)
  document.addEventListener('mousemove', onResizeMove)
  document.addEventListener('mouseup', onResizeUp)

  emit('resize-start')
}

function onResizeMove(e: MouseEvent) {
  if (!resizing.value || !resizeVisual.value)
    return

  const dx = e.clientX - resizeStartPos.value.x
  const dy = e.clientY - resizeStartPos.value.y

  if (dx === 0 && dy === 0 && !hasMoved.value)
    return

  hasMoved.value = true

  let newW = Math.max(20, resizeStartSize.value.width + dx)
  let newH = Math.max(20, resizeStartSize.value.height + dy)

  // Apply snapping for SE resize (snap the moving right/bottom edges)
  const targets = {
    xs: props.snapXLines || [],
    ys: props.snapYLines || [],
  }
  if ((targets.xs.length || targets.ys.length) && props.snapThreshold > 0) {
    const snap = snapResizeSE(
      {
        left: props.left,
        top: props.top,
        width: newW,
        height: newH,
      },
      targets,
      props.snapThreshold,
    )
    newW = snap.width
    newH = snap.height
  }

  resizeVisual.value = { width: newW, height: newH }

  emit('resize-update', { width: newW, height: newH })
}

function onResizeUp() {
  if (resizing.value && hasMoved.value && resizeVisual.value) {
    emit('resize-end', {
      width: resizeVisual.value.width,
      height: resizeVisual.value.height,
    })
  }

  resizing.value = false
  hasMoved.value = false
  resizeVisual.value = null

  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeUp)
}

function onContextmenu(e: MouseEvent) {
  emit('contextmenu', e)
}

function onDblClick(e: MouseEvent) {
  emit('dblclick', e)
}

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeUp)
})
</script>

<template>
  <div
    class="canvas-item"
    :class="[
      itemClass,
      {
        'is-editing': isEditing,
        'is-selected': isSelected,
        'focus': isFocused,
        'is-dragging': !!dragVisual,
        'is-resizing': !!resizeVisual,
        'is-disabled': disabled,
        'no-selection-outline': !showSelectionOutline,
        // Only capture pointer for drag when actively editable and not locked
        'capture-for-drag': isEditing && !disabled,
      },
    ]"
    :style="getStyle()"
    @mousedown.stop="onMouseDown"
    @dblclick.stop="onDblClick"
    @contextmenu.stop.prevent="onContextmenu"
  >
    <div class="canvas-item__body">
      <slot />
    </div>

    <span
      v-if="shouldShowResizer()"
      class="canvas-item__resizer"
      @mousedown.stop="onResizeStart"
    />
  </div>
</template>

<style lang="scss" scoped>
.canvas-item {
  position: absolute;
  touch-action: none;
  cursor: default;
  box-sizing: border-box;
  transition: none;

  &.is-editing {
    cursor: grab;
  }

  /* Locked frame (e.g. container being edited inside): dashed border + default cursor; events pass to children.
     Only for cases where the consumer does not provide its own border (i.e. inner slots).
     Root-level items pass show-selection-outline=false and use .list-group-item::after dashed instead. */
  &.is-editing.is-disabled:not(.no-selection-outline) {
    cursor: default;
    outline: 2px dashed var(--el-color-primary);
    outline-offset: -1px;
    z-index: 15;
  }

  &.is-selected:not(.no-selection-outline),
  &.focus:not(.no-selection-outline) {
    outline: 2px solid var(--el-color-primary);
    outline-offset: -1px;
    z-index: 10;
  }

  &.is-dragging {
    /* 拖拽时鼠标样式统一使用 GroupAbsoluteCanvas 风格 */
    cursor: grabbing;
    z-index: 100;
    opacity: 0.9;
    user-select: none;
  }

  &.is-resizing {
    z-index: 100;
  }

  /* Do NOT set pointer-events:none here when disabled.
     "disabled" means "this frame cannot be dragged/resized" (e.g. when editing inside a container),
     but descendants (inner GridCanvas, child components) must still receive events. */
  &.is-disabled {
    /* Ensure the wrapper itself does not block hit testing for inner editable content */
    pointer-events: auto;
  }

  .canvas-item__body {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }

  /* Only when this CanvasItem is the active drag surface (editing and not locked),
     we force slotted content to be non-interactive so the item's own rect can capture drag.
     When disabled (locked container frame) or not capturing, let inner content (GridCanvas etc.) handle events. */
  &.capture-for-drag .canvas-item__body {
    :deep(*) {
      pointer-events: none !important;
    }
  }

  /* When the consumer provides its own selection visuals (e.g. .list-group-item::after),
     suppress the default outline to avoid double borders. */
  &.no-selection-outline {
    &.is-selected,
    &.focus {
      outline: none;
    }
  }
}

.canvas-item__resizer {
  position: absolute;
  right: 0;
  bottom: 0;
  box-sizing: border-box;
  width: 10px;
  height: 10px;
  cursor: se-resize;
  z-index: 20;
  touch-action: none;

  /* 与 GridLayoutPlus 一致的 L 形深色边框手柄（无填充背景） */
  &::before {
    position: absolute;
    inset: 0 3px 3px 0;
    content: '';
    border: 0 solid #444;
    border-right-width: 2px;
    border-bottom-width: 2px;
  }
}
</style>
