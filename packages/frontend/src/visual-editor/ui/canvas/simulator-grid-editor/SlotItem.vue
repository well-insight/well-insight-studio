<script lang="ts" setup>
import type { CSSProperties, PropType } from 'vue'
import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { useVModel } from '@vueuse/core'
import { cloneDeep } from 'lodash-es'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import SlotGridCanvas from '@/packages/pc/container-component/shared/SlotGridCanvas.vue'
import { useControlStore } from '@/stores/controlStore'
import { generateNanoid } from '@/visual-editor/lib'
import CompRender from './comp-render'
import DraggableTransitionGroup from './DraggableTransitionGroup.vue'

defineOptions({
  name: 'SlotItem',
})

const props = defineProps({
  slotKey: {
    type: String as PropType<string | number>,
    default: '',
  },
  drag: {
    type: Boolean as PropType<boolean>,
    default: false,
  },
  children: {
    type: Array as PropType<VisualEditorBlockData[]>,
    default: (): VisualEditorBlockData[] => [],
  },
  selectComp: {
    type: Function as PropType<(comp: VisualEditorBlockData, event?: MouseEvent) => void>,
    required: true,
  },
  onContextmenuBlock: {
    type: Function as PropType<
      (e: MouseEvent, block: VisualEditorBlockData, parentBlocks?: VisualEditorBlockData[]) => void
    >,
    required: true,
  },
  parentVid: {
    type: String as PropType<string>,
    default: '',
  },
  selectedBlockIds: {
    type: Array as PropType<string[]>,
    default: (): string[] => [],
  },
  /** 当前处于容器编辑模式的容器 _vid */
  editingContainerId: {
    type: String as PropType<string | null>,
    default: null,
  },
  /** 父组件是否为容器 */
  isContainer: {
    type: Boolean,
    default: false,
  },
  /** 通过 _vid 选中块（用于点击容器内空白区域选中容器） */
  selectBlockByVid: {
    type: Function as PropType<(vid: string, event?: MouseEvent) => void>,
    default: undefined,
  },
  onInnerGroupDblClick: {
    type: Function as PropType<(groupVid: string, event: MouseEvent) => void>,
    default: undefined,
  },
  /** 每个子块应用于外层 .list-group-item 的样式映射（用于组内绝对定位） */
  blockWrapperStyles: {
    type: Object as PropType<Record<string, CSSProperties>>,
    default: (): Record<string, CSSProperties> => ({}),
  },
  /** 禁止从外部拖入新组件（容器插槽默认禁止） */
  disallowDrop: {
    type: Boolean as PropType<boolean>,
    default: false,
  },
  /** 拖拽进入容器回调（用于延时进入编辑模式）
   * @param containerVid 容器ID
   * @param immediate 是否立即进入编辑模式
   */
  onDragEnterContainer: {
    type: Function as PropType<(containerVid: string, immediate?: boolean) => void>,
    default: undefined,
  },
  /** 拖拽离开容器回调（用于取消延时） */
  onDragLeaveContainer: {
    type: Function as PropType<() => void>,
    default: undefined,
  },
  updateGroupInnerBlockPosition: {
    type: Function as PropType<(vid: string, left: number, top: number) => void>,
    default: undefined,
  },
  updateGroupInnerBlockSize: {
    type: Function as PropType<(vid: string, width: number, height: number) => void>,
    default: undefined,
  },
  onGroupInnerDragEnd: {
    type: Function as PropType<() => void>,
    default: undefined,
  },
})
const emit = defineEmits(['update:children', 'on-selected', 'update:drag'])

const controlStore = useControlStore()

const isDrag = useVModel(props, 'drag', emit)
const slotChildren = useVModel(props, 'children', emit)

// 容器包装器 ref，用于原生事件调试
const containerSlotRef = ref<HTMLElement>()

// 原生事件监听（调试用，可移除）
onMounted(() => {
  // 调试时可在此添加原生事件监听
})

/** 是否为容器插槽 */
const isContainerSlot = computed(() => props.disallowDrop)
/** 当前容器是否处于容器编辑模式 */
const isEditingThisContainer = computed(() => isContainerSlot.value && props.editingContainerId === props.parentVid)

/** 当前正在拖拽的容器内组件 */
const draggingInnerBlock = ref<string | null>(null)
/** 拖拽开始时的鼠标位置 */
const dragStartPos = ref({ x: 0, y: 0 })
/** 拖拽开始时的组件位置 */
const dragStartBlockPos = ref({ left: 0, top: 0 })
/** 是否发生了实际移动 */
const hasInnerDragMoved = ref(false)
/** 当前正在缩放尺寸的容器内组件 */
const resizingInnerBlock = ref<string | null>(null)
const resizeStartPos = ref({ x: 0, y: 0 })
const resizeStartSize = ref({ width: 0, height: 0 })
const hasInnerResizeChanged = ref(false)

function getInnerBlockStyle(block: VisualEditorBlockData): CSSProperties {
  return (props.blockWrapperStyles as Record<string, CSSProperties>)[block._vid] || {}
}

function isGroupInnerBlock(block: VisualEditorBlockData) {
  return Boolean((props.blockWrapperStyles as Record<string, CSSProperties>)[block._vid])
}

function isInnerBlockLocked(block: VisualEditorBlockData) {
  return isGroupInnerBlock(block) && !isEditingThisContainer.value
}

function shouldShowInnerResizer(block: VisualEditorBlockData) {
  return isGroupInnerBlock(block)
    && isEditingThisContainer.value
    && (block.focus || props.selectedBlockIds.includes(block._vid))
}

function parsePx(value: string | number | undefined, fallback = 0) {
  return Number.parseInt(String(value ?? ''), 10) || fallback
}

function onContainerSlotMouseDown(e: MouseEvent) {
  if (!isEditingThisContainer.value)
    return
  if ((e.target as HTMLElement).closest('.group-inner-block'))
    return
  e.stopPropagation()
  props.selectBlockByVid?.(props.parentVid, e)
}

/** 处理拖拽进入容器 - 触发延时进入编辑模式 */
function onDragEnter(e: DragEvent) {
  // 必须先阻止默认行为，否则元素不会成为可放置目标
  e.preventDefault()
  e.stopPropagation()
  if (!props.isContainer || !props.parentVid)
    return
  props.onDragEnterContainer?.(props.parentVid)
}

/** 处理拖拽离开容器 - 取消延时 */
function onDragLeave(e: DragEvent) {
  if (!props.isContainer)
    return
  e.preventDefault()
  e.stopPropagation()
  // 检查是否真的离开了容器（而不是进入了子元素）
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = e.clientX
  const y = e.clientY
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    props.onDragLeaveContainer?.()
  }
}

/** 处理拖拽在容器上方移动 */
function _onDragOver(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
}

/** 处理 SlotGridCanvas 的放置事件（非编辑模式下） */
function onSlotGridDrop(_e: DragEvent) {
  // 通知父容器立即进入编辑模式
  if (props.isContainer && props.parentVid)
    props.onDragEnterContainer?.(props.parentVid, true)
}

/** 处理非容器插槽的放置事件 */
function onNativeDrop(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()

  const block = controlStore.moveVisualData
  if (!block) {
    return
  }

  const copiedBlock = cloneDeep(block) as VisualEditorBlockData
  copiedBlock._vid = `vid_${generateNanoid()}`
  copiedBlock.i = copiedBlock._vid
  copiedBlock.focus = false
  copiedBlock.focusWithChild = false

  slotChildren.value = [...slotChildren.value, copiedBlock]
  controlStore.setMoveVisualData(null)
  props.selectComp(copiedBlock)
}

/** 处理容器内组件的鼠标按下事件 - 选中并准备拖拽 */
function onInnerBlockMouseDown(e: MouseEvent, block: VisualEditorBlockData) {
  if (e.button !== 0)
    return

  if (isInnerBlockLocked(block))
    return

  props.selectComp(block, e)

  if (!isGroupInnerBlock(block))
    return

  e.preventDefault()
  e.stopPropagation()

  const blockStyle = getInnerBlockStyle(block)
  draggingInnerBlock.value = block._vid
  hasInnerDragMoved.value = false
  dragStartPos.value = { x: e.clientX, y: e.clientY }

  const leftVal = Number.parseInt(String(blockStyle.left || '0'), 10) || 0
  const topVal = Number.parseInt(String(blockStyle.top || '0'), 10) || 0
  dragStartBlockPos.value = { left: leftVal, top: topVal }

  document.addEventListener('mousemove', onInnerBlockMouseMove)
  document.addEventListener('mouseup', onInnerBlockMouseUp)
}

/** 处理容器内组件的鼠标移动事件 - 实时更新位置 */
function onInnerBlockMouseMove(e: MouseEvent) {
  if (!draggingInnerBlock.value)
    return

  const dx = e.clientX - dragStartPos.value.x
  const dy = e.clientY - dragStartPos.value.y

  if (dx === 0 && dy === 0)
    return

  hasInnerDragMoved.value = true

  const newLeft = dragStartBlockPos.value.left + dx
  const newTop = dragStartBlockPos.value.top + dy

  props.updateGroupInnerBlockPosition?.(draggingInnerBlock.value, newLeft, newTop)
}

/** 处理容器内组件的鼠标释放事件 - 结束拖拽 */
function onInnerBlockMouseUp() {
  if (hasInnerDragMoved.value)
    props.onGroupInnerDragEnd?.()

  draggingInnerBlock.value = null
  hasInnerDragMoved.value = false
  document.removeEventListener('mousemove', onInnerBlockMouseMove)
  document.removeEventListener('mouseup', onInnerBlockMouseUp)
}

function onInnerBlockResizeStart(e: MouseEvent, block: VisualEditorBlockData) {
  if (e.button !== 0 || isInnerBlockLocked(block))
    return

  e.preventDefault()
  e.stopPropagation()
  props.selectComp(block, e)

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
  props.updateGroupInnerBlockSize?.(
    resizingInnerBlock.value,
    resizeStartSize.value.width + dx,
    resizeStartSize.value.height + dy,
  )
}

function onInnerBlockResizeUp() {
  if (hasInnerResizeChanged.value)
    props.onGroupInnerDragEnd?.()

  resizingInnerBlock.value = null
  hasInnerResizeChanged.value = false
  document.removeEventListener('mousemove', onInnerBlockResizeMove)
  document.removeEventListener('mouseup', onInnerBlockResizeUp)
}

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onInnerBlockMouseMove)
  document.removeEventListener('mouseup', onInnerBlockMouseUp)
  document.removeEventListener('mousemove', onInnerBlockResizeMove)
  document.removeEventListener('mouseup', onInnerBlockResizeUp)
})

function onInnerBlockDblClick(e: MouseEvent, block: VisualEditorBlockData) {
  if (block.componentKey !== 'group')
    return
  if (isInnerBlockLocked(block))
    return
  props.onInnerGroupDblClick?.(block._vid, e)
}

// 初始化时设置上次选中的组件
props.children.some(item => item.focus && props.selectComp(item))
</script>

<template>
  <!-- 容器插槽：使用 SlotGridCanvas 实现 grid-layout-plus 网格布局 -->
  <template v-if="isContainer">
    <div
      ref="containerSlotRef"
      class="container-slot-wrapper"
      :class="{
        'is-editing': isEditingThisContainer,
      }"
      @mousedown="onContainerSlotMouseDown"
    >
      <SlotGridCanvas
        :children="slotChildren"
        :slot-key="String(slotKey)"
        :parent-focus="isContainerSlot"
        :is-editing="isEditingThisContainer"
        @update:children="slotChildren = $event"
        @drag-enter="onDragEnter"
        @drag-leave="onDragLeave"
        @drop="onSlotGridDrop"
      />
    </div>
  </template>

  <!-- 非容器插槽：使用 DraggableTransitionGroup 实现拖拽排序 -->
  <DraggableTransitionGroup
    v-else
    v-model="slotChildren"
    v-model:drag="isDrag"
    class="inner-draggable"
    :class="{
      slot: !slotChildren?.length,
    }"
    draggable=".item-drag"
    :data-slot="`插槽（${slotKey}）\n 拖拽组件到此处`"
    @dragover.prevent
    @drop="onNativeDrop"
  >
    <template #item="{ element: innerElement }">
      <div
        class="list-group-item inner"
        :data-label="innerElement.label"
        :style="getInnerBlockStyle(innerElement)"
        :class="{
          'focus': innerElement.focus,
          'focusWithChild': innerElement.focusWithChild,
          'multi-focus': selectedBlockIds.includes(innerElement._vid),
          'is-dragging': draggingInnerBlock === innerElement._vid,
          'is-resizing': resizingInnerBlock === innerElement._vid,
          'group-inner-block': isGroupInnerBlock(innerElement),
          'group-inner-block--locked': isInnerBlockLocked(innerElement),
          [`list-group-item-${innerElement._vid}`]: true,
        }"
        @contextmenu.stop.prevent="onContextmenuBlock($event, innerElement, slotChildren)"
        @mousedown.stop="onInnerBlockMouseDown($event, innerElement)"
        @dblclick.stop="onInnerBlockDblClick($event, innerElement)"
      >
        <CompRender
          :element="innerElement"
          :style="{
            pointerEvents: isInnerBlockLocked(innerElement)
              ? 'none'
              : (Object.keys(innerElement.props?.slots || {}).length ? 'auto' : 'none'),
          }"
        >
          <template v-for="(value, key) in innerElement.props?.slots" :key="key" #[key]>
            <SlotItem
              v-model:children="value.children"
              v-model:drag="isDrag"
              :slot-key="key"
              :parent-vid="innerElement._vid"
              :selected-block-ids="selectedBlockIds"
              :editing-container-id="editingContainerId"
              :is-container="['group', 'container', 'layout', 'form'].includes(innerElement.componentKey)"
              :block-wrapper-styles="blockWrapperStyles"
              :disallow-drop="['group', 'container', 'layout', 'form'].includes(innerElement.componentKey) || props.disallowDrop"
              :on-contextmenu-block="onContextmenuBlock"
              :select-comp="selectComp"
              :select-block-by-vid="selectBlockByVid"
              :on-inner-group-dbl-click="onInnerGroupDblClick"
              :on-drag-enter-container="onDragEnterContainer"
              :on-drag-leave-container="onDragLeaveContainer"
              :update-group-inner-block-position="updateGroupInnerBlockPosition"
              :update-group-inner-block-size="updateGroupInnerBlockSize"
              :on-group-inner-drag-end="onGroupInnerDragEnd"
            />
          </template>
        </CompRender>
        <span
          v-if="shouldShowInnerResizer(innerElement)"
          class="group-inner-resizer"
          @mousedown.stop="onInnerBlockResizeStart($event, innerElement)"
        />
      </div>
    </template>
  </DraggableTransitionGroup>
</template>

<style lang="scss" scoped>
@use './func.scss' as *;

// 容器插槽包装器样式
.container-slot-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  // 始终允许接收事件，让 SlotGridCanvas 自己处理内部交互
  pointer-events: auto;
}

.inner-draggable {
  position: relative;
}

.inner-draggable.slot::after {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  height: auto;
  min-height: 40px;
  font-size: 12px;
  color: #8591a2;
  text-align: center;
  background: rgba(246, 247, 249, 0.5);
  content: attr(data-slot);
  outline: 1px dashed #dedede;
  outline-offset: -1px;
  flex-direction: column;
  justify-content: center;
}

.list-group-item {
  position: relative;
  padding: 3px;
  cursor: move;

  &.focusWithChild {
    @include showContainerBorder;
  }

  &.focus {
    @include showSoliOutline;

    &::after {
      @include showCompLabel(top);

      opacity: 0;
      transition: opacity 0.2s;
    }

    &:hover::after {
      opacity: 1;
    }
  }

  &.multi-focus {
    outline: 2px solid var(--el-color-warning);
    outline-offset: -1px;
  }

  &.inner {
    cursor: grab;

    &:hover {
      @include showSoliOutline;

      &::after {
        opacity: 1;
        transition: opacity 0.2s;
        @include showSoliOutline;
        @include showCompLabel(top);
      }
    }

    &.group-inner-block {
      padding: 0;
      box-sizing: border-box;
    }

    &.group-inner-block--locked {
      pointer-events: none;
      cursor: default;

      &:hover {
        outline: none;

        &::after {
          opacity: 0;
        }
      }
    }

    &.group-inner-block.focus {
      z-index: 20;
    }

    &.is-dragging {
      cursor: grabbing;
      z-index: 100;
      opacity: 0.85;
    }

    &.is-resizing {
      z-index: 100;
      opacity: 0.85;
    }
  }
}

.group-inner-resizer {
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: 30;
  box-sizing: border-box;
  width: 10px;
  height: 10px;
  cursor: se-resize;

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
