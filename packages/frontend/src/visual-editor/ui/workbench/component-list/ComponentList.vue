<script lang="ts" setup>
import type { ScrollbarDirection } from 'element-plus'

import type { VisualEditorComponent } from '@/visual-editor/visual-editor.utils'
import { cloneDeep } from 'lodash-es'
import { computed, ref } from 'vue'
import DraggableTransitionGroup from '@/visual-editor/ui/canvas/simulator-editor/DraggableTransitionGroup.vue'
import { createNewBlock } from '@/visual-editor/visual-editor.utils'
import { visualConfig } from '@/visual.config'

const activeComp = ref('基础组件')

const widgets = computed(() => {
  const { baseWidgets, containerComponents, formWidgets, chartWidgets } = visualConfig.componentModules
  return [
    {
      title: '基础组件',
      widgets: baseWidgets
    },
    {
      title: '表单组件',
      widgets: formWidgets
    },
    {
      title: '图表组件',
      widgets: chartWidgets
    },
    {
      title: '容器组件',
      widgets: containerComponents
    }
  ]
})

const currentCompIndex = computed(() => widgets.value?.findIndex(e => e?.title === activeComp.value))

function dragChange(evt: Event) {
  console.log('onChange:', evt)
}
// 克隆组件
function cloneDog(comp: VisualEditorComponent) {
  console.log('当前拖拽的组件：', comp)
  const newComp = cloneDeep(comp)
  return createNewBlock(newComp)
}

// function loadMore(direction: ScrollbarDirection) {
//   if (direction === 'bottom') {
//     if (currentCompIndex.value < widgets.value?.length - 1) {
//       activeComp.value = widgets.value?.[currentCompIndex.value + 1]?.title
//     }
//     else if (currentCompIndex.value === widgets.value?.length) {
//       activeComp.value = widgets.value[0].title
//     }
//   }
// }
</script>

<template>
  <div class="w-full h-full">
    <el-tabs v-model="activeComp" tab-position="left" class="h-full border-around-1" :class="$style.tabs">
      <el-tab-pane v-for="(e, i) in widgets" :key="i" class="h-full w-full" :label="e.title" :name="e.title">
        <el-scrollbar>
          <DraggableTransitionGroup
            v-model="e.widgets"
            :class="$style['list-group']"
            :group="{ name: 'components', pull: 'clone', put: false }"
            :clone="cloneDog"
            item-key="key"
            @change="dragChange"
          >
            <template #item="{ element }">
              <div :class="$style.listGroupItem" :data-label="element.label">
                <component :is="element?.preview" />
              </div>
            </template>
          </DraggableTransitionGroup>
        </el-scrollbar>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="scss" module>
.tabs {
  height: 100%;
  width: 100%;
}

.list-group {
  display: inline-block;
  width: 100%;

  :global(.el-date-editor) {
    width: 100% !important;
  }
}

.list-group-item {
  position: relative;
  display: flex;
  width: calc(100% - 20px);
  min-height: 120px;
  height: 100%;
  padding: 0 5px;
  margin-top: 20px;
  margin-left: 10px;
  border: solid 1px var(--el-border-color);
  transform: translate(0);
  box-sizing: border-box;
  align-items: center;
  justify-content: center;

  &:hover {
    cursor: move;
    border-color: var(--el-color-primary);
  }

  &:last-of-type {
    margin-bottom: 20px;
  }

  &::before {
    position: absolute;
    top: -3px;
    left: -3px;
    z-index: 1;
    padding: 4px 8px;
    font-size: 12px;
    color: white;
    background-color: var(--el-color-primary);
    content: attr(data-label);
  }

  &::after {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 2;
    content: '';
  }
}
</style>
