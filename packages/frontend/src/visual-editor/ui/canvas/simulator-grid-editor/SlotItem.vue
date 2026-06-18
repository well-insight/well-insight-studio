<script lang="ts" setup>
import type { CSSProperties, PropType } from 'vue'
import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { useVModel } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'
import GridCanvas from '@/packages/pc/container-component/shared/GridCanvas.vue'

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

const isDrag = useVModel(props, 'drag', emit)
const slotChildren = useVModel(props, 'children', emit)

// 容器包装器 ref，用于原生事件调试
const containerSlotRef = ref<HTMLElement>()

/** 是否为容器插槽 */
const isContainerSlot = computed(() => props.disallowDrop)
/** 当前容器是否处于容器编辑模式 */
const isEditingThisContainer = computed(() => isContainerSlot.value && props.editingContainerId === props.parentVid)

function onContainerSlotMouseDown(e: MouseEvent) {
  if (!isEditingThisContainer.value)
    return
  if ((e.target as HTMLElement).closest('.slot-grid-item, .group-inner-block'))
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

/** 处理 GridCanvas 的放置事件（非编辑模式下） */
function onSlotGridDrop(_e: DragEvent) {
  // 通知父容器立即进入编辑模式
  if (props.isContainer && props.parentVid)
    props.onDragEnterContainer?.(props.parentVid, true)
}

// 初始化时恢复上次选中的组件（放在 onMounted，避免 setup 阶段触发选中导致递归更新）
onMounted(() => {
  const focusedChild = props.children.find(item => item.focus)
  if (focusedChild)
    props.selectComp(focusedChild)
})
</script>

<template>
  <!-- 容器插槽：包装器 + GridCanvas -->
  <div
    v-if="isContainer"
    ref="containerSlotRef"
    class="container-slot-wrapper"
    :class="{ 'is-editing': isEditingThisContainer }"
    @mousedown="onContainerSlotMouseDown"
  >
    <GridCanvas
      :children="slotChildren"
      :slot-key="String(slotKey)"
      :container-vid="parentVid"
      :parent-focus="isContainerSlot"
      :is-editing="isEditingThisContainer"
      @update:children="slotChildren = $event"
      @drag-enter="onDragEnter"
      @drag-leave="onDragLeave"
      @drop="onSlotGridDrop"
    />
  </div>

  <!-- 非容器插槽：统一使用 GridCanvas -->
  <GridCanvas
    v-else
    :children="slotChildren"
    :slot-key="String(slotKey)"
    :container-vid="parentVid"
    :parent-focus="false"
    :is-editing="true"
    @update:children="slotChildren = $event"
  />
</template>

<style lang="scss" scoped>
@use './func.scss' as *;

// 容器插槽包装器样式
.container-slot-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  // 始终允许接收事件，让 GridCanvas 自己处理内部交互
  pointer-events: auto;
}
</style>
