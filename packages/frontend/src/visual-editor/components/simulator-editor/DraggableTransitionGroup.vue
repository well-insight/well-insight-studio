<script lang="ts" setup>
import { useVModel } from '@vueuse/core'
import { computed } from 'vue'
import draggable from 'vuedraggable'
import { useControlStore } from '@/store/useControlStore/useControlStore'
import { createNewBlock } from '@/visual-editor/visual-editor.utils'

defineOptions({
  name: 'DraggableTransitionGroup'
})

const props = withDefaults(
  defineProps<{
    drag?: boolean
    itemKey?: string
    group?: object
    fallbackClass?: string
  }>(),
  {
    itemKey: '_vid',
    group: () => ({ name: 'components' }),
    drag: true,
    fallbackClass: ''
  }
)

const emit = defineEmits(['update:moduleValue', 'update:drag'])

const controlStore = useControlStore()

const moduleValue = defineModel<any[]>()

const isDrag = useVModel(props, 'drag', emit)

const dragOptions = computed(() => ({
  animation: 200,
  disabled: false,
  scroll: true,
  ghostClass: 'ghost'
}))

function dragStart(evt: DragEvent & { oldIndex?: number; originalEvent?: DragEvent }) {
  isDrag.value = true

  const current = moduleValue.value?.[evt?.oldIndex || 0]
  controlStore.setMoveVisualData(createNewBlock(current))
}
</script>

<template>
  <draggable
    v-model="moduleValue"
    class="dragArea list-group"
    :class="{ isDrag }"
    :component-data="{
      tag: 'ul',
      type: 'transition-group',
      name: !isDrag ? 'flip-list' : null
    }"
    :group="group"
    v-bind="{ ...dragOptions, ...$attrs }"
    :item-key="itemKey"
    @start="dragStart"
    @end="isDrag = false"
  >
    <template #item="item">
      <div :class="{ 'item-drag': item.element.draggable }" :data-el="item.element.draggable">
        <slot name="item" v-bind="item" />
      </div>
    </template>
  </draggable>
</template>

<style lang="scss" scoped>
@import './func.scss';

.flip-list-move {
  transition: transform 0.5s;
}

.no-move {
  transition: transform 0s;
}

.ghost {
  background: #c8ebfb;
  opacity: 0.5;
}

.list-group {
  height: 100%;
  min-height: 40px;
  overflow: auto;

  &::-webkit-scrollbar {
    width: 0;
  }

  // &.isDrag div[data-draggable='true'] {
  //   padding: 2px 0;
  // }

  &.isDrag:not(.no-child) :deep(.list-group-item.has-slot) {
    @include showContainerBorder;
  }
}
</style>
