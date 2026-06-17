<script lang="ts" setup>
import type { CSSProperties, PropType } from 'vue'
import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { computed, inject, onBeforeUnmount, ref } from 'vue'
import { ContainerEditorContextKey, EditingContainerIdKey } from '@/packages/pc/container-component/container'
import CompRender from '@/visual-editor/ui/canvas/simulator-grid-editor/comp-render'

const props = defineProps({
  children: {
    type: Array as PropType<VisualEditorBlockData[]>,
    default: (): VisualEditorBlockData[] => [],
  },
  containerVid: {
    type: String,
    default: '',
  },
  parentFocus: {
    type: Boolean,
    default: false,
  },
  isEditing: {
    type: Boolean,
    default: false,
  },
})

const editorCtx = inject(ContainerEditorContextKey, null)
const editingContainerId = inject(EditingContainerIdKey, ref<string | null>(null))

const isEditingMode = computed(() =>
  Boolean(props.containerVid) && editingContainerId.value === props.containerVid,
)

const selectedIds = computed(() => editorCtx?.selectedBlockIds.value ?? [])
const draggingInnerBlock = ref<string | null>(null)
const dragStartPos = ref({ x: 0, y: 0 })
const dragStartBlockPos = ref({ left: 0, top: 0 })
const hasInnerDragMoved = ref(false)
const resizingInnerBlock = ref<string | null>(null)
const resizeStartPos = ref({ x: 0, y: 0 })
const resizeStartSize = ref({ width: 0, height: 0 })
const hasInnerResizeChanged = ref(false)

function getInnerBlockStyle(child: VisualEditorBlockData): CSSProperties {
  const layout = child.groupInnerLayout
  if (!layout)
    return {}

  return {
    position: 'absolute',
    left: layout.left,
    top: layout.top,
    width: layout.width,
    height: layout.height,
    margin: '0',
    padding: '0',
    boxSizing: 'border-box',
    flex: 'none',
    overflow: 'visible',
  }
}

function parsePx(value: string | number | undefined, fallback = 0) {
  return Number.parseInt(String(value ?? ''), 10) || fallback
}

function isBlockSelected(vid: string) {
  return selectedIds.value.includes(vid)
}

function shouldShowResizer(child: VisualEditorBlockData) {
  return isEditingMode.value && (child.focus || isBlockSelected(child._vid))
}

function handleCanvasMousedown(e: MouseEvent) {
  if (!isEditingMode.value) {
    e.stopPropagation()
    if (props.containerVid)
      editorCtx?.selectContainerByVid?.(props.containerVid, e)
    return
  }
  e.stopPropagation()
}

function handleCanvasPointerdown(e: PointerEvent) {
  if (!isEditingMode.value)
    return
  e.stopPropagation()
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

function onInnerBlockPointerdown(e: PointerEvent) {
  if (!isEditingMode.value)
    return
  e.stopPropagation()
}

function onInnerBlockMouseDown(e: MouseEvent, block: VisualEditorBlockData) {
  if (!isEditingMode.value || e.button !== 0)
    return

  editorCtx?.selectComp(block, e)
  e.preventDefault()
  e.stopPropagation()

  const blockStyle = getInnerBlockStyle(block)
  draggingInnerBlock.value = block._vid
  hasInnerDragMoved.value = false
  dragStartPos.value = { x: e.clientX, y: e.clientY }
  dragStartBlockPos.value = {
    left: parsePx(blockStyle.left as string, 0),
    top: parsePx(blockStyle.top as string, 0),
  }

  document.addEventListener('mousemove', onInnerBlockMouseMove)
  document.addEventListener('mouseup', onInnerBlockMouseUp)
}

function onInnerBlockMouseMove(e: MouseEvent) {
  if (!draggingInnerBlock.value)
    return

  const dx = e.clientX - dragStartPos.value.x
  const dy = e.clientY - dragStartPos.value.y
  if (dx === 0 && dy === 0)
    return

  hasInnerDragMoved.value = true
  editorCtx?.updateGroupInnerBlockPosition?.(
    draggingInnerBlock.value,
    dragStartBlockPos.value.left + dx,
    dragStartBlockPos.value.top + dy,
  )
}

function onInnerBlockMouseUp() {
  if (hasInnerDragMoved.value)
    editorCtx?.onGroupInnerDragEnd?.()

  draggingInnerBlock.value = null
  hasInnerDragMoved.value = false
  document.removeEventListener('mousemove', onInnerBlockMouseMove)
  document.removeEventListener('mouseup', onInnerBlockMouseUp)
}

function onInnerBlockResizeStart(e: MouseEvent, block: VisualEditorBlockData) {
  if (!isEditingMode.value || e.button !== 0)
    return

  e.preventDefault()
  e.stopPropagation()
  editorCtx?.selectComp(block, e)

  const blockStyle = getInnerBlockStyle(block)
  resizingInnerBlock.value = block._vid
  hasInnerResizeChanged.value = false
  resizeStartPos.value = { x: e.clientX, y: e.clientY }
  resizeStartSize.value = {
    width: parsePx(blockStyle.width as string, 100),
    height: parsePx(blockStyle.height as string, 100),
  }

  document.addEventListener('mousemove', onInnerBlockResizeMove)
  document.addEventListener('mouseup', onInnerBlockResizeUp)
}

function onInnerBlockResizeMove(e: MouseEvent) {
  if (!resizingInnerBlock.value)
    return

  const dx = e.clientX - resizeStartPos.value.x
  const dy = e.clientY - resizeStartPos.value.y
  if (dx === 0 && dy === 0)
    return

  hasInnerResizeChanged.value = true
  editorCtx?.updateGroupInnerBlockSize?.(
    resizingInnerBlock.value,
    resizeStartSize.value.width + dx,
    resizeStartSize.value.height + dy,
  )
}

function onInnerBlockResizeUp() {
  if (hasInnerResizeChanged.value)
    editorCtx?.onGroupInnerDragEnd?.()

  resizingInnerBlock.value = null
  hasInnerResizeChanged.value = false
  document.removeEventListener('mousemove', onInnerBlockResizeMove)
  document.removeEventListener('mouseup', onInnerBlockResizeUp)
}

function onInnerBlockDblClick(e: MouseEvent, block: VisualEditorBlockData) {
  if (!isEditingMode.value || block.componentKey !== 'group')
    return
  e.stopPropagation()
  editorCtx?.enterContainerEditMode?.(block._vid)
  editorCtx?.selectContainerByVid?.(block._vid, e)
}

function onInnerContextmenu(e: MouseEvent, block: VisualEditorBlockData) {
  if (!isEditingMode.value)
    return
  e.preventDefault()
  e.stopPropagation()
  editorCtx?.onContextmenuBlock(e, block, props.children)
}

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onInnerBlockMouseMove)
  document.removeEventListener('mouseup', onInnerBlockMouseUp)
  document.removeEventListener('mousemove', onInnerBlockResizeMove)
  document.removeEventListener('mouseup', onInnerBlockResizeUp)
})
</script>

<template>
  <div
    class="group-absolute-canvas"
    :class="{
      'is-editing': isEditingMode,
      'is-focused': parentFocus && !isEditingMode,
    }"
    @mousedown="handleCanvasMousedown"
    @pointerdown="handleCanvasPointerdown"
    @dblclick.stop="handleContainerDblClick"
  >
    <div
      v-for="child in children"
      :key="child._vid"
      class="group-absolute-item"
      :class="{
        'is-selected': isBlockSelected(child._vid),
        'is-editing': isEditingMode,
        'focus': child.focus,
        'is-dragging': draggingInnerBlock === child._vid,
        'is-resizing': resizingInnerBlock === child._vid,
      }"
      :style="getInnerBlockStyle(child)"
      @mousedown.stop="onInnerBlockMouseDown($event, child)"
      @pointerdown.stop="onInnerBlockPointerdown($event)"
      @dblclick.stop="onInnerBlockDblClick($event, child)"
      @contextmenu.stop.prevent="onInnerContextmenu($event, child)"
    >
      <CompRender
        :element="child"
        :style="{ pointerEvents: 'none' }"
      />
      <span
        v-if="shouldShowResizer(child)"
        class="group-inner-resizer"
        @mousedown.stop="onInnerBlockResizeStart($event, child)"
      />
    </div>
    <div v-if="!children.length" class="group-absolute-empty">
      <span class="empty-text">
        {{ isEditingMode ? '组内暂无组件' : '双击组进入编辑模式' }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.group-absolute-canvas {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: visible;
  pointer-events: auto;
}

.group-absolute-item {
  position: absolute;
  touch-action: none;
  cursor: default;

  :deep(.comp-render-root),
  :deep(.comp-render-root *) {
    pointer-events: none !important;
  }

  &.is-editing {
    cursor: grab;
    z-index: 20;
  }

  &.is-selected,
  &.focus {
    outline: 2px solid var(--el-color-primary);
    outline-offset: -1px;
    z-index: 10;
  }

  &.is-dragging {
    cursor: grabbing;
    z-index: 100;
    opacity: 0.9;
  }
}

.group-inner-resizer {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 10px;
  height: 10px;
  cursor: se-resize;
  background: var(--el-color-primary);
  z-index: 20;
}

.group-absolute-empty {
  width: 100%;
  height: 100%;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #dcdfe6;
  background: #fafafa;

  .empty-text {
    color: #909399;
    font-size: 12px;
  }
}
</style>
