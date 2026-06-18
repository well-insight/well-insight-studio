<script lang="ts" setup>
import type { CSSProperties, PropType } from 'vue'
import { onBeforeUnmount, ref } from 'vue'

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
})

const emit = defineEmits([
  'mousedown',
  'select',
  'contextmenu',
  'dblclick',
  'drag-start',
  'drag-end',
  'resize-start',
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

function parsePx(value: string | number | undefined, fallback = 0) {
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

  const newLeft = dragStartRect.value.left + dx
  const newTop = dragStartRect.value.top + dy

  dragVisual.value = { left: newLeft, top: newTop }
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

  const newW = Math.max(20, resizeStartSize.value.width + dx)
  const newH = Math.max(20, resizeStartSize.value.height + dy)

  resizeVisual.value = { width: newW, height: newH }
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

  &.is-selected,
  &.focus {
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

  &.is-disabled {
    pointer-events: none;
  }

  .canvas-item__body {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;

    /* 强制内容不拦截鼠标，由外层处理拖拽 */
    :deep(*) {
      pointer-events: none !important;
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
