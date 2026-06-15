<script lang="ts" setup>
import type { PropType } from 'vue'
import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { useVModel } from '@vueuse/core'
import { cloneDeep } from 'lodash-es'
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
    type: Function as PropType<(comp: VisualEditorBlockData) => void>,
    required: true,
  },
  onContextmenuBlock: {
    type: Function as PropType<
      (e: MouseEvent, block: VisualEditorBlockData, parentBlocks?: VisualEditorBlockData[]) => void
    >,
    required: true,
  },
})
const emit = defineEmits(['update:children', 'on-selected', 'update:drag'])

const controlStore = useControlStore()

const isDrag = useVModel(props, 'drag', emit)
const slotChildren = useVModel(props, 'children', emit)

function onNativeDrop(event: DragEvent) {
  event.preventDefault()
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
}

// 初始化时设置上次选中的组件
props.children.some(item => item.focus && props.selectComp(item))
</script>

<template>
  <DraggableTransitionGroup
    v-model="slotChildren"
    v-model:drag="isDrag"
    class="inner-draggable"
    :class="{ slot: !slotChildren?.length }"
    draggable=".item-drag"
    :data-slot="`插槽（${slotKey}）\n 拖拽组件到此处`"
    @dragover.prevent
    @drop="onNativeDrop"
  >
    <template #item="{ element: innerElement }">
      <div
        class="list-group-item inner"
        :data-label="innerElement.label"
        :class="{
          focus: innerElement.focus,
          focusWithChild: innerElement.focusWithChild,
        }"
        @contextmenu.stop.prevent="onContextmenuBlock($event, innerElement, slotChildren)"
        @mousedown.stop="selectComp(innerElement)"
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
              :on-contextmenu-block="onContextmenuBlock"
              :select-comp="selectComp"
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

  &.inner:hover {
    @include showSoliOutline;

    &::after {
      opacity: 1;
      transition: opacity 0.2s;
      @include showSoliOutline;
      @include showCompLabel(top);
    }
  }
}
</style>
