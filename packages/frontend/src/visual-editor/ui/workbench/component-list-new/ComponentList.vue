<script lang="ts" setup>
import type { ScrollbarDirection } from "element-plus";

import type { VisualEditorComponent } from "@/visual-editor/visual-editor.utils";
import { cloneDeep, isString } from "lodash-es";
import { computed, ref } from "vue";
import DraggableTransitionGroup from "@/visual-editor/ui/canvas/simulator-editor/DraggableTransitionGroup.vue";
import { createNewBlock } from "@/visual-editor/visual-editor.utils";
import { visualConfig } from "@/visual.config";
import { SvgIcon } from "@/components/svg-icon";
import { useControlStore } from "@/stores";

const activeComp = ref("基础组件");

const controlStore = useControlStore();

const widgets = computed(() => {
  const { baseWidgets, containerComponents, formWidgets } = visualConfig.componentModules;
  return [
    {
      title: "基础组件",
      icon: "component-base",
      widgets: baseWidgets,
    },
    {
      title: "表单组件",
      icon: "component-form",
      widgets: formWidgets,
    },
    {
      title: "图表组件",
      icon: "component-chart",
      widgets: [],
    },
    {
      title: "容器组件",
      icon: "component-content",
      widgets: containerComponents,
    },
  ];
});

function dragStart(visual: VisualEditorComponent, index: number) {
  controlStore.setIsDragging(true);
  controlStore.setMoveVisualData(createNewBlock(cloneDeep(visual)));
}

function dragging() {
  controlStore.setDraggingVisualKey((new Date()).getTime().toString())
}

function dragEnd() {
  controlStore.setIsDragging(false);
}
</script>

<template>
  <div
    :class="$style['component-list-container']"
    class="flex flex-col items-center justify-center gap-[24px] rounded-[24px] bg-[var(--el-bg-color)] px-2 py-3"
  >
    <el-popover
      v-for="(e, i) in widgets"
      trigger="hover"
      :key="i"
      placement="right"
      transition="el-zoom-in-left"
      :width="300"
      :popper-class="$style['component-popover']"
      :teleported="false"
    >
      <template #reference>
        <el-button text class="h-[40px] w-[40px] p-[6px]">
          <svg-icon :size="18" :name="e.icon"></svg-icon>
        </el-button>
      </template>

      <el-scrollbar class="w-full select-none" view-style="padding: 8px" max-height="500px">
        <template v-for="(w, i) in e.widgets" :key="i">
          <div
            class="flex w-full cursor-pointer items-center gap-2 rounded-[4px] px-2 py-2"
            :class="$style['component-item']"
            draggable="true"
            @dragstart="dragStart(w, i)"
            @drag="dragging"
            @dragend="dragEnd"
          >
            <el-button class="h-[45px] w-[45px]" text bg>
              <svg-icon v-if="isString(w?.icon)" :size="35" :name="w?.icon"></svg-icon>
            </el-button>
            <div class="flex h-full w-0 flex-auto flex-col items-start self-start">
              <el-text class="self-start text-[16px]">{{ w.label }}</el-text>
              <el-text class="self-start text-[12px]">{{ w.description }}</el-text>
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
