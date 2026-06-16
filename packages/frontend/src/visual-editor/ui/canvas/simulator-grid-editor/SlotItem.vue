<script lang="ts" setup>
import type { CSSProperties, PropType } from 'vue'
import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { useVModel } from '@vueuse/core'
import { cloneDeep } from 'lodash-es'
import { onBeforeUnmount, ref } from 'vue'
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
  /** 每个子块应用于外层 .list-group-item 的样式映射 */
  blockWrapperStyles: {
    type: Object as PropType<Record<string, CSSProperties>>,
    default: (): Record<string, CSSProperties> => ({}),
  },
  /** 禁止从外部拖入新组件 */
  disallowDrop: {
    type: Boolean as PropType<boolean>,
    default: false,
  },
  updateGroupInnerBlockPosition: {
    type: Function as PropType<(vid: string, left: number, top: number) => void>,
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

/** 当前正在拖拽的组内组件 */
const draggingInnerBlock = ref<string | null>(null)
/** 拖拽开始时的鼠标位置 */
const dragStartPos = ref({ x: 0, y: 0 })
/** 拖拽开始时的组件位置 */
const dragStartBlockPos = ref({ left: 0, top: 0 })
/** 是否发生了实际移动 */
const hasInnerDragMoved = ref(false)

function getInnerBlockStyle(block: VisualEditorBlockData): CSSProperties {
  return (props.blockWrapperStyles as Record<string, CSSProperties>)[block._vid] || {}
}

function isGroupInnerBlock(block: VisualEditorBlockData) {
  return Boolean((props.blockWrapperStyles as Record<string, CSSProperties>)[block._vid])
}

function onNativeDrop(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()

  if (props.disallowDrop)
    return

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

/** 处理组内组件的鼠标按下事件 - 选中并准备拖拽 */
function onInnerBlockMouseDown(e: MouseEvent, block: VisualEditorBlockData) {
  if (e.button !== 0)
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

/** 处理组内组件的鼠标移动事件 - 实时更新位置 */
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

/** 处理组内组件的鼠标释放事件 - 结束拖拽 */
function onInnerBlockMouseUp() {
  if (hasInnerDragMoved.value)
    props.onGroupInnerDragEnd?.()

  draggingInnerBlock.value = null
  hasInnerDragMoved.value = false
  document.removeEventListener('mousemove', onInnerBlockMouseMove)
  document.removeEventListener('mouseup', onInnerBlockMouseUp)
}

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onInnerBlockMouseMove)
  document.removeEventListener('mouseup', onInnerBlockMouseUp)
})

// 初始化时设置上次选中的组件
props.children.some(item => item.focus && props.selectComp(item))
</script>

<template>
  <DraggableTransitionGroup
    v-model="slotChildren"
    v-model:drag="isDrag"
    class="inner-draggable"
    :class="{
      'slot': !slotChildren?.length,
      'group-inner-slot': disallowDrop,
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
          'group-inner-block': isGroupInnerBlock(innerElement),
        }"
        @contextmenu.stop.prevent="onContextmenuBlock($event, innerElement, slotChildren)"
        @mousedown.stop="onInnerBlockMouseDown($event, innerElement)"
      >
        <CompRender
          :element="innerElement"
          :style="{
            pointerEvents: Object.keys(innerElement.props?.slots || {}).length ? 'auto' : 'none',
          }"
        >
          <template v-for="(value, key) in innerElement.props?.slots" :key="key" #[key]>
            <SlotItem
              v-model:children="value.children"
              v-model:drag="isDrag"
              :slot-key="key"
              :parent-vid="innerElement._vid"
              :selected-block-ids="selectedBlockIds"
              :block-wrapper-styles="blockWrapperStyles"
              :disallow-drop="innerElement.componentKey === 'group' || props.disallowDrop"
              :on-contextmenu-block="onContextmenuBlock"
              :select-comp="selectComp"
              :update-group-inner-block-position="updateGroupInnerBlockPosition"
              :on-group-inner-drag-end="onGroupInnerDragEnd"
            />
          </template>
        </CompRender>
      </div>
    </template>
  </DraggableTransitionGroup>
</template>

<style lang="scss" scoped>
@use './func.scss' as *;

.inner-draggable {
  position: relative;
}

.inner-draggable.group-inner-slot {
  width: 100%;
  height: 100%;

  :deep(.list-group) {
    position: relative;
    height: 100%;
    min-height: 0;
    overflow: visible;
  }
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

    &.group-inner-block.focus {
      z-index: 20;
    }

    &.is-dragging {
      cursor: grabbing;
      z-index: 100;
      opacity: 0.85;
    }
  }
}
</style>
