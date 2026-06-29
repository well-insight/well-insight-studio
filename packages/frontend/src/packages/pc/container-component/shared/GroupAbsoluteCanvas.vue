<script lang="ts" setup>
import type { PropType } from 'vue'
import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { useResizeObserver } from '@vueuse/core'
import { computed, inject, ref } from 'vue'
import { ContainerEditorContextKey, EditingContainerIdKey } from '@/packages/pc/container-component/container'
import CanvasItem from './CanvasItem.vue'
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

const canvasRef = ref<HTMLElement>()
const groupCanvasWidth = ref(0)
const groupCanvasHeight = ref(0)

useResizeObserver(canvasRef, (entries) => {
  const rect = entries[0]?.contentRect
  groupCanvasWidth.value = rect?.width ?? 0
  groupCanvasHeight.value = rect?.height ?? 0
})

function isBlockSelected(vid: string) {
  return selectedIds.value.includes(vid)
}

function getChildPixelRect(child: VisualEditorBlockData) {
  const layout = child.groupInnerLayout
  return {
    left: Number.parseInt(String(layout?.left ?? '0'), 10) || 0,
    top: Number.parseInt(String(layout?.top ?? '0'), 10) || 0,
    width: Number.parseInt(String(layout?.width ?? '100'), 10) || 100,
    height: Number.parseInt(String(layout?.height ?? '100'), 10) || 100,
  }
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

/** 非编辑态下点击组内子项 → 选中组容器本身 */
function handleItemMouseDown(e: MouseEvent) {
  if (!isEditingMode.value) {
    if (props.containerVid) {
      editorCtx?.selectContainerByVid?.(props.containerVid, e)
    }
    e.stopPropagation()
    return
  }
}

// 拖拽结束：直接提交像素位置（组使用绝对定位），并夹在组边界内
function onItemDragEnd(child: VisualEditorBlockData, pos: { left: number, top: number }) {
  const rect = getChildPixelRect(child)
  let l = Math.max(0, pos.left)
  let t = Math.max(0, pos.top)
  if (groupCanvasWidth.value > 0) {
    l = Math.min(l, Math.max(0, groupCanvasWidth.value - rect.width))
  }
  if (groupCanvasHeight.value > 0) {
    t = Math.min(t, Math.max(0, groupCanvasHeight.value - rect.height))
  }
  editorCtx?.updateGroupInnerBlockPosition?.(child._vid, l, t)
  editorCtx?.onGroupInnerDragEnd?.()
}

// 缩放结束：直接提交像素尺寸
function onItemResizeEnd(child: VisualEditorBlockData, size: { width: number, height: number }) {
  const base = getChildPixelRect(child)
  let w = Math.max(20, size.width)
  let h = Math.max(20, size.height)
  if (groupCanvasWidth.value > 0) {
    w = Math.min(w, Math.max(20, groupCanvasWidth.value - base.left))
  }
  if (groupCanvasHeight.value > 0) {
    h = Math.min(h, Math.max(20, groupCanvasHeight.value - base.top))
  }
  editorCtx?.updateGroupInnerBlockSize?.(child._vid, w, h)
  editorCtx?.onGroupInnerDragEnd?.()
}

function onInnerBlockDblClick(e: MouseEvent, block: VisualEditorBlockData) {
  // Allow direct dive into nested groups (and other containers) when dblclicked inside an editing parent
  const isGroupOrContainer = block.componentKey === 'group' || block.componentKey === 'container' || block.componentKey === 'layout' || block.componentKey === 'form'
  if (!isEditingMode.value || !isGroupOrContainer)
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
</script>

<template>
  <div
    ref="canvasRef"
    class="group-absolute-canvas"
    :class="{
      'is-editing': isEditingMode,
      'is-focused': parentFocus && !isEditingMode,
    }"
    @mousedown="handleCanvasMousedown"
    @pointerdown="handleCanvasPointerdown"
    @dblclick.stop="handleContainerDblClick"
  >
    <CanvasItem
      v-for="child in children"
      :key="child._vid"
      :vid="child._vid"
      :left="getChildPixelRect(child).left"
      :top="getChildPixelRect(child).top"
      :width="getChildPixelRect(child).width"
      :height="getChildPixelRect(child).height"
      :is-editing="isEditingMode"
      :is-selected="isBlockSelected(child._vid)"
      :is-focused="child.focus"
      :disabled="child.static || child._containerEditLocked || child._layerLocked"
      item-class="group-absolute-item"
      :container-width="groupCanvasWidth"
      :container-height="groupCanvasHeight"
      @mousedown="handleItemMouseDown"
      @select="editorCtx?.selectComp(child, $event)"
      @contextmenu="onInnerContextmenu($event, child)"
      @dblclick="onInnerBlockDblClick($event, child)"
      @drag-end="onItemDragEnd(child, $event)"
      @resize-end="onItemResizeEnd(child, $event)"
    >
      <CompRender
        :element="child"
        :style="{ pointerEvents: 'none' }"
      />
    </CanvasItem>

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

/* 组内子项使用共享 CanvasItem，额外加 group 特定包裹类以便定位 */
.group-absolute-item {
  /* CanvasItem 提供基础定位、grab/grabbing、选中描边、resizer 样式 */
  :deep(.canvas-item__body) {
    overflow: visible; /* 组允许内容溢出 */
  }
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
