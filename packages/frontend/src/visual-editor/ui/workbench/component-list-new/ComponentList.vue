<script lang="ts" setup>
import type { VisualEditorComponent } from '@/visual-editor/visual-editor.utils'
import { cloneDeep, isString } from 'lodash-es'
import { computed, ref } from 'vue'
import { SvgIcon } from '@/components/svg-icon'
import { useControlStore } from '@/stores'
import { createNewBlock } from '@/visual-editor/visual-editor.utils'
import { visualConfig } from '@/visual.config'

const emits = defineEmits<{
  dragStart: [value: VisualEditorComponent, index: number]
  drag: [k: string]
  dragEnd: []
  dblclickAdd: [value: VisualEditorComponent]
}>()

const activeComp = ref('基础组件')

const controlStore = useControlStore()

const widgets = computed(() => {
  const { baseWidgets, containerComponents, formWidgets, chartWidgets } = visualConfig.componentModules
  return [
    {
      title: '基础组件',
      icon: 'component-base',
      widgets: baseWidgets,
    },
    {
      title: '表单组件',
      icon: 'component-form',
      widgets: formWidgets,
    },
    {
      title: '图表组件',
      icon: 'component-chart',
      widgets: chartWidgets,
    },
    {
      title: '容器组件',
      icon: 'component-content',
      widgets: containerComponents,
    },
  ]
})

function dragStart(e: DragEvent, visual: VisualEditorComponent, index: number) {
  e.dataTransfer?.setData('text/plain', visual.key)
  e.dataTransfer!.effectAllowed = 'move'
  controlStore.setIsDragging(true)
  controlStore.setMoveVisualData(createNewBlock(cloneDeep(visual)))
  emits('dragStart', visual, index)
}

function dragging() {
  controlStore.setDraggingVisualKey(Date.now().toString())
  emits('drag', controlStore.draggingVisualKey)
}

function dragEnd() {
  controlStore.setIsDragging(false)
  emits('dragEnd')
}

function onDblClick(w: VisualEditorComponent) {
  const newBlock = createNewBlock(cloneDeep(w))
  emits('dblclickAdd', newBlock)
}
</script>

<template>
  <div
    :class="$style['component-list-container']"
    class="flex flex-col items-center justify-center gap-[24px] rounded-[24px] bg-[var(--el-bg-color)] px-2 py-3"
  >
    <el-popover
      v-for="(e, i) in widgets"
      :key="i"
      trigger="hover"
      placement="right"
      transition="el-zoom-in-left"
      :width="260"
      :popper-class="$style['component-popover']"
      :teleported="true"
    >
      <template #reference>
        <el-button text class="h-[40px] w-[40px] p-[6px]">
          <SvgIcon :size="18" :name="e.icon" />
        </el-button>
      </template>

      <el-scrollbar class="w-full select-none" view-style="padding: 8px" max-height="500px">
        <template v-for="(w, i) in e.widgets" :key="i">
          <div
            class="flex w-full cursor-pointer items-center gap-2 rounded-[4px] px-2 py-2"
            :class="$style['component-item']"
            draggable="true"
            @dragstart="(e) => dragStart(e, w, i)"
            @drag="dragging"
            @dragend="dragEnd"
            @dblclick="onDblClick(w)"
          >
            <el-button class="h-[45px] w-[45px]" text bg>
              <SvgIcon v-if="isString(w?.icon)" :size="35" :name="w?.icon" />
            </el-button>
            <div class="flex h-full w-0 flex-auto flex-col items-start self-start">
              <el-text class="self-start text-[16px]">
                {{ w.label }}
              </el-text>
              <el-text class="self-start text-[12px]">
                {{ w.description }}
              </el-text>
            </div>
          </div>
        </template>
      </el-scrollbar>
    </el-popover>
  </div>
</template>

<style lang="scss" module>
.component-list-container {
  box-shadow: var(--el-box-shadow-light);
  :global {
    .el-button + .el-button {
      margin-left: 0;
    }
  }
}
.component-popover {
  padding: 0 !important;
}
.component-item {
  &:hover {
    background-color: var(--el-color-primary-light-9);

    :global(.svg-icon) {
      color: var(--el-color-primary);
    }
  }
}
</style>
