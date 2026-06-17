<script lang="ts" setup>
import type { CSSProperties, PropType } from 'vue'
import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { useResizeObserver } from '@vueuse/core'
import { cloneDeep } from 'lodash-es'
import { computed, inject, nextTick, onMounted, ref, watch } from 'vue'
import { GridItem, GridLayout } from '@/components/grid-layout-plus'
import { ContainerEditorContextKey, EditingContainerIdKey } from '@/packages/pc/container-component/container'
import {
  calcSlotColNum,
  calcSlotDropLayout,
  SLOT_ROW_HEIGHT,
} from '@/packages/pc/container-component/shared/slot-grid.utils'
import { useControlStore } from '@/stores/controlStore'
import { generateNanoid } from '@/visual-editor/lib'
import CompRender from '@/visual-editor/ui/canvas/simulator-grid-editor/comp-render'

interface GridItemLayout {
  x: number
  y: number
  w: number
  h: number
  i: string
}

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
const editorCtx = inject(ContainerEditorContextKey, null)
const editingContainerId = inject(EditingContainerIdKey, ref<string | null>(null))

/** 直接读取画布注入的编辑态，避免 h() 传参快照滞后 */
const isEditingMode = computed(() =>
  Boolean(props.containerVid) && editingContainerId.value === props.containerVid,
)

const canvasRef = ref<HTMLElement>()
const emptyRef = ref<HTMLElement>()
const gridLayoutRef = ref<InstanceType<typeof GridLayout>>()
const slotWidth = ref(0)

useResizeObserver(canvasRef, (entries) => {
  slotWidth.value = entries[0]?.contentRect.width ?? 0
})

onMounted(() => {
  if (canvasRef.value)
    slotWidth.value = canvasRef.value.clientWidth
})

/** 与主画布一致：按插槽实际宽度动态计算列数，保持 15px 步长 */
const effectiveColNum = computed(() =>
  slotWidth.value > 0 ? calcSlotColNum(slotWidth.value) : props.colNum,
)

const localChildren = computed({
  get: () => props.children || [],
  set: val => emit('update:children', val),
})

const childMap = computed(() => {
  const map = new Map<string, VisualEditorBlockData>()
  for (const child of localChildren.value)
    map.set(child._vid, child)
  return map
})

const layout = computed<GridItemLayout[]>(() =>
  localChildren.value.map(child => ({
    x: child.x ?? 0,
    y: child.y ?? 0,
    w: child.w ?? 4,
    h: child.h ?? 2,
    i: child._vid,
  })),
)

const isDraggable = computed(() => isEditingMode.value)
const isResizable = computed(() => isEditingMode.value)

watch(isEditingMode, (editing) => {
  if (editing) {
    nextTick(() => {
      gridLayoutRef.value?.layoutUpdate?.()
    })
  }
})

function isBlockSelected(vid: string) {
  return editorCtx?.selectedBlockIds.value.includes(vid) ?? false
}

function handleLayoutUpdated(newLayout: GridItemLayout[]) {
  let changed = false
  const updated = localChildren.value.map((child) => {
    const item = newLayout.find(l => l.i === child._vid)
    if (item && (child.x !== item.x || child.y !== item.y || child.w !== item.w || child.h !== item.h)) {
      changed = true
      return {
        ...child,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        hasResize: child.w !== item.w || child.h !== item.h ? true : child.hasResize,
      }
    }
    return child
  })
  if (changed)
    emit('update:children', updated)
}

function handleMove(_i: string, _newX: number, _newY: number) {
  // 拖拽过程中不写入 children，避免 layout 重算打断 interact 拖拽
}

function handleResize(_i: string, _oldH: number, _oldW: number, _newH: number, _newW: number) {
  // 缩放过程中不写入 children，由 layout-updated 统一同步
}

function handleInteractionEnd() {
  editorCtx?.recordHistory()
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
  if (!isEditingMode.value) {
    e.stopPropagation()
    if (props.containerVid)
      editorCtx?.selectContainerByVid?.(props.containerVid, e)
    return
  }

  e.stopPropagation()

  const target = e.target as HTMLElement
  if (!target.closest('.vgl-item') && props.containerVid)
    editorCtx?.selectContainerByVid?.(props.containerVid, e)
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
  if (!block || !isEditingMode.value || !NESTED_CONTAINER_KEYS.has(block.componentKey))
    return
  e.stopPropagation()
  editorCtx?.enterContainerEditMode?.(block._vid)
  editorCtx?.selectContainerByVid?.(block._vid, e)
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()

  const block = controlStore.moveVisualData
  if (!block)
    return

  if (!isEditingMode.value)
    emit('drop', e)

  const dropTarget = (gridLayoutRef.value?.$el ?? canvasRef.value ?? emptyRef.value) as HTMLElement | undefined
  if (!dropTarget)
    return

  const dropRoot = (dropTarget.closest('.slot-grid-canvas') ?? dropTarget) as HTMLElement
  const { x: gridX, y: gridY, w, h } = calcSlotDropLayout(dropRoot, e.clientX, e.clientY, block)

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
</script>

<template>
  <div
    ref="canvasRef"
    class="slot-grid-canvas"
    :data-slot-key="slotKey"
    :class="{
      'is-editing': isEditingMode,
      'is-focused': parentFocus && !isEditingMode,
    }"
    @dragenter.prevent="handleDragEnter"
    @dragleave.prevent="handleDragLeave"
    @dragover.prevent="handleDragOver"
    @drop.prevent="handleDrop"
    @mousedown="handleCanvasMousedown"
    @dblclick.stop="handleContainerDblClick"
  >
    <GridLayout
      v-if="layout.length > 0"
      ref="gridLayoutRef"
      :layout="layout"
      class="slot-grid-layout"
      :class="{ 'is-editing': isEditingMode }"
      :col-num="effectiveColNum"
      :row-height="SLOT_ROW_HEIGHT"
      :is-draggable="isDraggable"
      :is-resizable="isResizable"
      :allow-overlap="true"
      :vertical-compact="false"
      :use-css-transforms="true"
      :margin="[0, 0]"
      :prevent-collision="false"
      :is-bounded="true"
      @layout-updated="handleLayoutUpdated"
      @dragenter.prevent="handleDragEnter"
      @dragleave.prevent="handleDragLeave"
      @dragover.prevent="handleDragOver"
      @drop.prevent="handleDrop"
    >
      <GridItem
        v-for="item in layout"
        :key="item.i"
        :x="item.x"
        :y="item.y"
        :w="item.w"
        :h="item.h"
        :i="item.i"
        class="slot-grid-item"
        :class="{
          'is-selected': isBlockSelected(item.i),
          'is-editing': isEditingMode,
          'focus': childMap.get(item.i)?.focus,
        }"
        :static="false"
        :is-draggable="isDraggable"
        :is-resizable="isResizable"
        @move="(i: string, x: number, y: number) => handleMove(i, x, y)"
        @moved="handleInteractionEnd"
        @resize="(i: string, _h: number, _w: number, newH: number, newW: number) => handleResize(i, _h, _w, newH, newW)"
        @resized="handleInteractionEnd"
        @click.stop="(e: MouseEvent) => handleSelect(childMap.get(item.i), e)"
        @dblclick.stop="(e: MouseEvent) => handleInnerContainerDblClick(childMap.get(item.i), e)"
        @contextmenu.stop.prevent="(e: MouseEvent) => handleContextmenu(childMap.get(item.i), e)"
      >
        <div
          v-if="childMap.get(item.i)"
          class="slot-block-wrapper"
          :class="{ 'is-editing': isEditingMode }"
          :style="getBlockStyle(childMap.get(item.i)!)"
        >
          <CompRender
            :element="childMap.get(item.i)!"
            :style="{ pointerEvents: 'none' }"
          />
        </div>
      </GridItem>
    </GridLayout>
    <div
      v-else
      ref="emptyRef"
      class="slot-grid-empty"
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
.slot-grid-canvas {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: transparent;
  pointer-events: auto;

  &:not(.is-editing) {
    .slot-grid-layout,
    .slot-grid-item {
      pointer-events: none;
    }

    .slot-grid-empty {
      pointer-events: auto;
    }
  }

  &.is-editing {
    .slot-grid-layout,
    .slot-grid-item {
      pointer-events: auto;
    }
  }

  &.is-focused {
    .slot-grid-empty {
      background: #f0f7ff;
      border-color: #409eff;

      .empty-text {
        color: #409eff;
      }
    }
  }
}

:deep(.vue-grid-layout) {
  width: 100%;
  min-height: 100%;
}

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

.slot-grid-item {
  position: relative;
  touch-action: none;
  cursor: default;

  &.is-editing {
    cursor: grab;
  }

  &.is-selected,
  &.focus {
    outline: 2px solid var(--el-color-primary);
    outline-offset: -1px;
    z-index: 10;
  }

  :deep(.vue-resizable-handle) {
    z-index: 20;
    pointer-events: auto;
  }

  &.vue-grid-item.vue-grid-item-dragging {
    z-index: 100;
    opacity: 0.9;
    cursor: grabbing;
  }
}

.slot-block-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  pointer-events: none;
}
</style>
